import { assertEquals } from 'std/assert/mod.ts';
import { initializeDatabase, sql } from '../../src/db/client.ts';
import { getHWM, refreshFrontierHWM } from '../../src/services/discovery/frontier.ts';

Deno.test('Discovery - Frontier Scanner', async (t) => {
  await initializeDatabase();
  const originalFetch = globalThis.fetch;

  await t.step('refreshFrontierHWM - should use binary search and persist HWM', async () => {
    // Mock ESI to simulate a max ID of 2112000005
    globalThis.fetch = ((url: string) => {
      const match = url.match(/\/characters\/(\d+)\//);
      if (match) {
        const id = parseInt(match[1]);
        if (id <= 2112000005) {
          return Promise.resolve(new Response(JSON.stringify({ name: 'Valid' }), { status: 200 }));
        }
        return Promise.resolve(new Response(null, { status: 404 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ name: 'Valid' }), { status: 200 }));
    }) as typeof fetch;

    await refreshFrontierHWM();

    const charHwm = await getHWM('character');
    assertEquals(charHwm, 2112000005);
  });

  globalThis.fetch = originalFetch;
  await sql.end();
});
