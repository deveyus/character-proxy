
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./trpc/router.ts";
import { createTRPCContext } from "./trpc/context.ts";
import { initializeDatabase } from "./db/client.ts";

const PORT = parseInt(Deno.env.get("PORT") || "4321");

/**
 * Bootstraps and starts the API server.
 */
async function startServer() {
  console.log("Starting API server...");

  // Initialize database (existence check and migrations)
  await initializeDatabase();

  Deno.serve({ port: PORT }, (req) => {
    return fetchRequestHandler({
      endpoint: "/trpc",
      req,
      router: appRouter,
      createContext: createTRPCContext,
    });
  });

  console.log(`API server listening on http://localhost:${PORT}`);
}

if (import.meta.main) {
  startServer().catch((err) => {
    console.error("Server failed to start:", err);
    Deno.exit(1);
  });
}
