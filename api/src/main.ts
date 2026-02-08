import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { Hono } from 'hono';
import { serveStatic } from 'hono/deno';
import { appRouter } from './trpc/router.ts';
import { createTRPCContext } from './trpc/context.ts';
import { initializeDatabase, sql } from './db/client.ts';
import { hydrateNpcCorporations } from './db/hydration/npc_corps.ts';
import { logger, setupLogger } from './utils/logger.ts';
import { startDiscoveryWorker } from './services/discovery/worker.ts';
import { initializeLimiter } from './clients/esi_limiter.ts';
import { startMaintenanceWorker } from './services/discovery/maintenance.ts';
import { startProber } from './services/discovery/prober.ts';
import {
  addSseClient,
  initializeEventBridge,
  removeSseClient,
} from './services/discovery/events.ts';

const PORT = parseInt(Deno.env.get('PORT') || '4321');

/**
 * Bootstraps and starts the API server.
 */
async function startServer() {
  await setupLogger();
  logger.info('SYSTEM', 'Starting API server...');

  // Initialize database (existence check and migrations)
  const dbInit = await initializeDatabase();
  if (dbInit.isErr()) {
    logger.error('SYSTEM', `Failed to initialize database: ${dbInit.error.message}`, {
      error: dbInit.error,
    });
    Deno.exit(1);
  }

  // Load persistent limiter state
  await initializeLimiter();

  // Hydrate NPC corporations
  const hydrationResult = await hydrateNpcCorporations(sql);
  if (hydrationResult.isErr()) {
    logger.warn('SYSTEM', `NPC corporation hydration failed: ${hydrationResult.error.message}`);
  }

  // Start background discovery worker
  const workerCount = parseInt(Deno.env.get('WORKER_COUNT') || '1');
  logger.info('SYSTEM', `Starting ${workerCount} discovery workers...`);

  for (let i = 0; i < workerCount; i++) {
    startDiscoveryWorker(i).catch((err) => {
      logger.error('SYSTEM', `Discovery worker ${i} crashed`, { error: err });
    });
  }

  // Start maintenance worker
  startMaintenanceWorker().catch((err) => {
    logger.error('SYSTEM', 'Maintenance worker crashed', { error: err });
  });

  // Start proactive gap prober
  startProber().catch((err) => {
    logger.error('SYSTEM', 'Gap Prober crashed', { error: err });
  });

  // Initialize SSE bridge
  initializeEventBridge();

  const app = new Hono();

  // Logging middleware
  app.use('*', async (c, next) => {
    const start = Date.now();
    await next();
    const duration = Date.now() - start;
    logger.debug('SYSTEM', `${c.req.method} ${c.req.url} - ${c.res.status} (${duration}ms)`);
  });

  // Serve static files from api/static
  app.use('/static/*', serveStatic({ root: './api/' }));

  // Mount tRPC
  app.all('/trpc/*', (c) => {
    return fetchRequestHandler({
      endpoint: '/trpc',
      req: c.req.raw,
      router: appRouter,
      createContext: createTRPCContext,
    });
  });

  // Basic index redirect or shell
  app.get('/', (c) => {
    return c.redirect('/static/index.html');
  });

  // SSE Event Stream
  app.get('/api/events', (_c) => {
    let sseController: ReadableStreamDefaultController;
    const stream = new ReadableStream({
      start(controller) {
        sseController = controller;
        addSseClient(sseController);
      },
      cancel() {
        if (sseController) removeSseClient(sseController);
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  });

  Deno.serve({ port: PORT }, app.fetch);

  logger.info('SYSTEM', `API server listening on http://localhost:${PORT}`);
}

if (import.meta.main) {
  startServer().catch((err) => {
    logger.error(
      'SYSTEM',
      `Server initialization failed: ${err instanceof Error ? err.message : String(err)}`,
      {
        error: err instanceof Error
          ? { message: err.message, stack: err.stack }
          : { message: String(err) },
      },
    );
    Deno.exit(1);
  });
}
