import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context.ts';
import { z } from 'zod';
import * as characterService from '../services/character.ts';
import * as corporationService from '../services/corporation.ts';
import * as allianceService from '../services/alliance.ts';

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
      let result;
      if (input.type === 'character') {
        result = await characterService.getById(input.id);
      } else if (input.type === 'corporation') {
        result = await corporationService.getById(input.id);
      } else {
        result = await allianceService.getById(input.id);
      }

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
      let result;
      if (input.type === 'character') {
        result = await characterService.getByName(input.name);
      } else if (input.type === 'corporation') {
        result = await corporationService.getByName(input.name);
      } else {
        result = await allianceService.getByName(input.name);
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
