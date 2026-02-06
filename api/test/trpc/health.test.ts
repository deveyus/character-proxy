import { assertEquals } from 'std/assert/mod.ts';
import { appRouter } from '../../src/trpc/router.ts';
import { createTRPCContext } from '../../src/trpc/context.ts';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';

Deno.test('Health Check Endpoint', async (t) => {
  const ctx = createTRPCContext(
    { req: new Request('http://localhost') } as unknown as FetchCreateContextFnOptions,
  );
  const caller = appRouter.createCaller(ctx);

  await t.step('should return status ok', async () => {
    const result = await caller.health();
    assertEquals(result, { status: 'ok' });
  });
});
