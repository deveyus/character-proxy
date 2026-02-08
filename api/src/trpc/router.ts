import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context.ts';
import { z } from 'zod';
import * as characterService from '../services/character.ts';
import * as corporationService from '../services/corporation.ts';
import * as allianceService from '../services/alliance.ts';
import * as systemService from '../services/system.ts';

import * as authService from '../services/auth.ts';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Middleware-protected procedure that requires a valid dynamic API key.
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.apiKey) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'API Key missing',
    });
  }

  const isValid = await authService.validateKey(ctx.apiKey);
  if (!isValid) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid or revoked API Key',
    });
  }

  return next();
});

/**
 * Admin-only procedure protected by a master environment key.
 * Used for bootstrap and key management.
 */
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  const masterKey = Deno.env.get('MASTER_KEY');
  if (!masterKey || ctx.apiKey !== masterKey) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }
  return next();
});

export const appRouter = router({
  health: publicProcedure.query(() => {
    return { status: 'ok' };
  }),

  // --- Key Management ---
  registerApiKey: adminProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input }) => {
      const result = await authService.generateNewKey(input.name);
      if (result.isErr()) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error.message });
      }
      return result.value; // Returns { rawKey, id }
    }),

  revokeApiKey: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const result = await authService.revokeKey(input.id);
      if (result.isErr()) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error.message });
      }
      return { success: true };
    }),

  getSystemStatus: publicProcedure.query(async () => {
    const result = await systemService.getSystemStatus();
    if (result.isErr()) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error.message });
    }
    return result.value;
  }),

  resolveById: protectedProcedure.input(z.object({
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
