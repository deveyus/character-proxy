
import { assertEquals } from "std/assert/mod.ts";
import { appRouter } from "../../src/trpc/router.ts";
import { createTRPCContext } from "../../src/trpc/context.ts";

Deno.test("Health Check Endpoint", async (t) => {
  const ctx = createTRPCContext();
  const caller = appRouter.createCaller(ctx);

  await t.step("should return status ok", async () => {
    const result = await caller.health();
    assertEquals(result, { status: "ok" });
  });
});
