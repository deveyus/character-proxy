import { assertEquals } from 'std/assert/mod.ts';
import { getById } from '../../src/services/character.ts';
import { initializeDatabase, sql } from '../../src/db/client.ts';

Deno.test('Character Service - getById', async (t) => {
  await initializeDatabase();
  const originalFetch = globalThis.fetch;

  const charId = 211203;

  await t.step('should fetch from ESI on cache miss and save to DB', async () => {
    // 1. Mock ESI 200
    globalThis.fetch = (() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            name: 'Service Test Character',
            birthday: '2020-01-01T00:00:00Z',
            gender: 'male',
            race_id: 1,
            bloodline_id: 1,
            corporation_id: 1000001,
            security_status: 5.0,
          }),
          {
            status: 200,
            headers: {
              'etag': '"service-abc"',
              'expires': new Date(Date.now() + 60000).toUTCString(),
              'x-esi-error-limit-remain': '100',
              'x-esi-error-limit-reset': '60',
            },
          },
        ),
      )) as typeof fetch;

    // 2. Run service
    const result = await getById(charId);
    assertEquals(result.isOk(), true);
    if (result.isOk()) {
      assertEquals(result.value.data?.name, 'Service Test Character');
      assertEquals(result.value.data?.etag, '"service-abc"');
      assertEquals(result.value.metadata.source, 'fresh');
    }

    // 3. Verify DB
    const staticRec = await sql`SELECT * FROM character_static WHERE character_id = ${charId}`;
    assertEquals(staticRec.length, 1);
    assertEquals(staticRec[0].etag, '"service-abc"');

    const ephemeralRec =
      await sql`SELECT * FROM character_ephemeral WHERE character_id = ${charId}`;
    assertEquals(ephemeralRec.length, 1);
  });

  globalThis.fetch = originalFetch;
  await sql`DELETE FROM character_ephemeral WHERE character_id = ${charId}`;
  await sql`DELETE FROM character_static WHERE character_id = ${charId}`;
  await sql.end();
});
