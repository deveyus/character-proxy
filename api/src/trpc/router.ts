import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context.ts';
import { z } from 'zod';
import { resolveById, resolveByName } from '../db/repos/entity.repo.ts';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const appRouter = router({
  health: publicProcedure.query(() => {
    return { status: 'ok' };
  }),

  resolveById: publicProcedure
    .input(z.object({
      id: z.number(),
      type: z.enum(['character', 'corporation', 'alliance']),
    }))
    .query(async ({ input }) => {
      const result = await resolveById(input.id, input.type);
      if (result.isErr()) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.error.message,
        });
      }
      return result.value;
    }),

  resolveByName: publicProcedure
    .input(z.object({
      name: z.string(),
      type: z.enum(['character', 'corporation', 'alliance']),
    }))
    .query(async ({ input }) => {
      const result = await resolveByName(input.name, input.type);
      if (result.isErr()) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.error.message,
        });
      }
      return result.value;
    }),
});

export type AppRouter = typeof appRouter;
