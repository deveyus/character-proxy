import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './trpc/router.ts';
import { createTRPCContext } from './trpc/context.ts';
import { db, initializeDatabase } from './db/client.ts';
import { hydrateNpcCorporations } from './db/hydration/npc_corps.ts';

const PORT = parseInt(Deno.env.get('PORT') || '4321');

/**
 * Bootstraps and starts the API server.
 */
async function startServer() {
  console.log('Starting API server...');

  // Initialize database (existence check and migrations)
  const dbInit = await initializeDatabase();
  if (dbInit.isErr()) {
    console.error('Failed to initialize database:', dbInit.error);
    Deno.exit(1);
  }

  // Hydrate NPC corporations
  // We don't necessarily want to block startup for this if it takes a long time,
  // but for now we follow the "at startup" requirement.
  const hydrationResult = await hydrateNpcCorporations(db);
  if (hydrationResult.isErr()) {
    console.warn('NPC corporation hydration failed:', hydrationResult.error);
  }

  Deno.serve({ port: PORT }, (req) => {
    return fetchRequestHandler({
      endpoint: '/trpc',
      req,
      router: appRouter,
      createContext: createTRPCContext,
    });
  });

  console.log(`API server listening on http://localhost:${PORT}`);
}

if (import.meta.main) {
  startServer().catch((err) => {
    console.error('Server failed to start:', err);
    Deno.exit(1);
  });
}
