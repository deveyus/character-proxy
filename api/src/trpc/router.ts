import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context.ts';
import { z } from 'zod';
import * as characterService from '../services/character.ts';
import * as corporationService from '../services/corporation.ts';
import * as allianceService from '../services/alliance.ts';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Middleware-protected procedure that requires a valid API key.
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  const systemKey = Deno.env.get('API_KEY');

  // If no key is configured, allow access (for development)
  if (!systemKey) return next();

  if (ctx.apiKey !== systemKey) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid or missing API Key',
    });
  }

  return next();
});

export const appRouter = router({
  health: publicProcedure.query(() => {
    return { status: 'ok' };
  }),

  resolveById: protectedProcedure
    .input(z.object({
      id: z.number(),
      type: z.enum(['character', 'corporation', 'alliance']),
      maxAge: z.number().optional(),
    }))
    .query(async ({ input }) => {
      let result;
      if (input.type === 'character') {
        result = await characterService.getById(input.id, input.maxAge);
      }
      if (input.type === 'corporation') {
        result = await corporationService.getById(input.id, input.maxAge);
      }
      if (input.type === 'alliance') {
        result = await allianceService.getById(input.id, input.maxAge);
      }

      if (!result) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Unknown entity type: ${input.type}`,
        });
      }

      if (result.isErr()) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.error.message,
        });
      }
      return result.value;
    }),

  resolveByName: protectedProcedure
    .input(z.object({
      name: z.string(),
      type: z.enum(['character', 'corporation', 'alliance']),
      maxAge: z.number().optional(),
    }))
    .query(async ({ input }) => {
      let result;
      if (input.type === 'character') {
        result = await characterService.getByName(input.name, input.maxAge);
      }
      if (input.type === 'corporation') {
        result = await corporationService.getByName(input.name, input.maxAge);
      }
      if (input.type === 'alliance') {
        result = await allianceService.getByName(input.name, input.maxAge);
      }

      if (!result) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Unknown entity type: ${input.type}`,
        });
      }

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
