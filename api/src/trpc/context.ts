import { db } from '../db/client.ts';

/**
 * Defines the context for each tRPC request.
 */
export function createTRPCContext() {
  return {
    db,
  };
}

export type Context = ReturnType<typeof createTRPCContext>;
