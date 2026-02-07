import { assertEquals } from 'std/assert/mod.ts';
import { initializeDatabase, sql } from '../../src/db/client.ts';
import { runProberStep } from '../../src/services/discovery/prober.ts';

Deno.test('Discovery - Prober Service', async (t) => {
  await initializeDatabase();
  const originalFetch = globalThis.fetch;

  await t.step('runProberStep - should find and queue valid IDs from gaps', async () => {
    // 1. Setup predictable gaps
    await sql`DELETE FROM discovery_queue`;
    await sql`DELETE FROM character_ephemeral`;
    await sql`DELETE FROM character_static`;

    const now = new Date();
    await sql`
      INSERT INTO character_static (character_id, name, birthday, gender, race_id, bloodline_id)
      VALUES 
        (100, 'Char 100', ${now}, 'male', 1, 1),
        (102, 'Char 102', ${now}, 'male', 1, 1)
    `;

    // 2. Mock ESI /universe/names/ to return ID 101 as a character
    globalThis.fetch = ((url: string) => {
      if (url.includes('/universe/names/')) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              { id: 101, category: 'character', name: 'Valid Gap Character' },
            ]),
            { status: 200 },
          ),
        );
      }
      return Promise.resolve(new Response(null, { status: 404 }));
    }) as typeof fetch;

    // 3. Run prober step
    await runProberStep();

    // 4. Verify ID 101 is in the queue
    const queued = await sql`SELECT * FROM discovery_queue WHERE entity_id = 101`;
    assertEquals(queued.length, 1, 'Missing character should be queued');
  });

  globalThis.fetch = originalFetch;
  await sql.end();
});
