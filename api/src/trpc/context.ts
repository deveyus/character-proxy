import { db } from '../db/client.ts';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';

/**
 * Defines the context for each tRPC request.
 */
export function createTRPCContext({ req }: FetchCreateContextFnOptions) {
  const apiKey = req.headers.get('x-api-key');
  return {
    db,
    apiKey,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
