import { assertEquals, assertNotEquals } from 'std/assert/mod.ts';
import { initializeDatabase, sql } from '../../src/db/client.ts';
import * as characterService from '../../src/services/character.ts';
import * as db from '../../src/db/character.ts';

Deno.test('Service - Entity Lifecycle', async (t) => {
  await sql.unsafe(`
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO public;
  `);
  await initializeDatabase();
  const originalFetch = globalThis.fetch;

  await t.step('Character Tombstoning - should mark known character as terminated on 404', async () => {
    // 1. Setup a known character
    await sql`DELETE FROM character_ephemeral`;
    await sql`DELETE FROM character_static`;
    
    const charId = 12345;
    const now = new Date();
    await db.upsertStatic({
      characterId: charId,
      name: 'Test Character',
      birthday: now,
      gender: 'male',
      raceId: 1,
      bloodlineId: 1,
      terminatedAt: null,
      etag: null,
      expiresAt: new Date(0), // Force fetch
      lastModifiedAt: now,
      accessCount: 0,
      lastDiscoveryAt: null,
    });
    
    await db.appendEphemeral({
      characterId: charId,
      corporationId: 100,
      allianceId: null,
      securityStatus: 5.0,
    });

    // 2. Mock ESI to return 404
    globalThis.fetch = (() => {
      return Promise.resolve(new Response(null, { status: 404 }));
    }) as typeof fetch;

    // 3. Request the character
    const result = await characterService.getById(charId);
    if (result.isErr()) console.error('Test Result Error:', result.error);
    assertEquals(result.isOk(), true);
    
    if (result.isOk()) {
      const entity = result.value.data;
      assertNotEquals(entity, null);
      assertNotEquals(entity?.terminatedAt, null, 'Character should be marked as terminated');
    }
  });

  await t.step('Character Tombstoning - should NOT create a record for unknown character on 404', async () => {
    const unknownId = 99999;
    
    // Request an unknown character
    const result = await characterService.getById(unknownId);
    assertEquals(result.isOk(), true);
    if (result.isOk()) {
      assertEquals(result.value.data, null);
    }

    const dbCheck = await db.resolveById(unknownId);
    assertEquals(dbCheck.isOk(), true);
    if (dbCheck.isOk()) {
      assertEquals(dbCheck.value, null, 'Unknown character should not have a DB record');
    }
  });

  globalThis.fetch = originalFetch;
  await sql.end();
});
