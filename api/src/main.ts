import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './trpc/router.ts';
import { createTRPCContext } from './trpc/context.ts';
import { db, initializeDatabase } from './db/client.ts';
import { hydrateNpcCorporations } from './db/hydration/npc_corps.ts';
import { logger, setupLogger } from './utils/logger.ts';
import { startDiscoveryWorker } from './services/discovery/worker.ts';

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

  // Hydrate NPC corporations
  const hydrationResult = await hydrateNpcCorporations(db);
  if (hydrationResult.isErr()) {
    logger.warn('SYSTEM', `NPC corporation hydration failed: ${hydrationResult.error.message}`);
  }

  // Start background discovery worker
  startDiscoveryWorker().catch((err) => {
    logger.error('SYSTEM', 'Discovery worker crashed', { error: err });
  });

  Deno.serve({ port: PORT }, (req) => {
    return fetchRequestHandler({
      endpoint: '/trpc',
      req,
      router: appRouter,
      createContext: createTRPCContext,
    });
  });

  logger.info('SYSTEM', `API server listening on http://localhost:${PORT}`);
}

if (import.meta.main) {
  startServer().catch((err) => {
    logger.error(
      'SYSTEM',
      'Server failed to start',
      err instanceof Error ? err : new Error(String(err)),
    );
    Deno.exit(1);
  });
}
