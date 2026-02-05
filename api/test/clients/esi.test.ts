import { assertEquals } from "std/assert/mod.ts";
import { fetchEntity } from "../../src/clients/esi.ts";

Deno.test("ESI Client - fetchEntity", async (t) => {
  const originalFetch = globalThis.fetch;

  await t.step("should return Fresh data on 200 OK", async () => {
    globalThis.fetch = (() =>
      Promise.resolve(
        new Response(JSON.stringify({ name: "Test" }), {
          status: 200,
          headers: {
            "etag": '"abc"',
            "expires": new Date(Date.now() + 60000).toUTCString(),
          },
        }),
      )) as typeof fetch;

    const result = await fetchEntity<{ name: string }>("/test");
    assertEquals(result.status, "fresh");
    if (result.status === "fresh") {
      assertEquals(result.data.name, "Test");
      assertEquals(result.etag, '"abc"');
    }
  });

  await t.step("should return NotModified on 304", async () => {
    globalThis.fetch = (() =>
      Promise.resolve(
        new Response(null, {
          status: 304,
          headers: {
            "expires": new Date(Date.now() + 60000).toUTCString(),
          },
        }),
      )) as typeof fetch;

    const result = await fetchEntity("/test", '"abc"');
    assertEquals(result.status, "not_modified");
  });

  globalThis.fetch = originalFetch;
});
