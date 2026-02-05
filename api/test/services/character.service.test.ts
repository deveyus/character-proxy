import { assertEquals } from 'std/assert/mod.ts';
import { getById } from '../../src/services/character.ts';
import { client, db, initializeDatabase } from '../../src/db/client.ts';
import * as schema from '../../src/db/schema.ts';
import { eq } from 'drizzle-orm';

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
            },
          },
        ),
      )) as typeof fetch;

    // 2. Run service
    const result = await getById(charId);
    assertEquals(result.isOk(), true);
    if (result.isOk()) {
      assertEquals(result.value?.name, 'Service Test Character');
      assertEquals(result.value?.etag, '"service-abc"');
    }

    // 3. Verify DB
    const staticRec = await db.select().from(schema.characterStatic).where(
      eq(schema.characterStatic.characterId, charId),
    );
    assertEquals(staticRec.length, 1);
    assertEquals(staticRec[0].etag, '"service-abc"');

    const ephemeralRec = await db.select().from(schema.characterEphemeral).where(
      eq(schema.characterEphemeral.characterId, charId),
    );
    assertEquals(ephemeralRec.length, 1);
  });

  globalThis.fetch = originalFetch;
  await db.delete(schema.characterEphemeral).where(
    eq(schema.characterEphemeral.characterId, charId),
  );
  await db.delete(schema.characterStatic).where(eq(schema.characterStatic.characterId, charId));
  await client.end();
});
