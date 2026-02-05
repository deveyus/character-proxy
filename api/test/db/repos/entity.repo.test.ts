import { assertEquals } from 'std/assert/mod.ts';
import { client, db, initializeDatabase } from '../../../src/db/client.ts';
import * as schema from '../../../src/db/schema.ts';
import { eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { CharacterEntity, resolveById, resolveByName } from '../../../src/db/repos/entity.repo.ts';

Deno.test('Entity Repository', async (t) => {
  await initializeDatabase();

  const charId = 211201;
  const corpId = 1000002;

  // Setup test data
  await db.insert(schema.characterStatic).values({
    characterId: charId,
    name: 'Repo Test Character',
    birthday: new Date(),
    gender: 'male',
    raceId: 1,
    bloodlineId: 1,
  }).onConflictDoNothing();

  await db.insert(schema.characterEphemeral).values({
    recordId: uuidv7(),
    characterId: charId,
    corporationId: corpId,
    securityStatus: 5.0,
    recordedAt: new Date(Date.now() - 10000), // 10s ago
  });

  const latestRecordId = uuidv7();
  await db.insert(schema.characterEphemeral).values({
    recordId: latestRecordId,
    characterId: charId,
    corporationId: corpId,
    securityStatus: 4.5,
    recordedAt: new Date(), // Now
  });

  try {
    await t.step(
      'resolveById - should return the latest record joined with static data',
      async () => {
        const result = await resolveById(charId, 'character');
        assertEquals(result.isOk(), true);
        if (result.isOk()) {
          const data = result.value as CharacterEntity;
          assertEquals(data?.name, 'Repo Test Character');
          assertEquals(data?.securityStatus, 4.5);
        }
      },
    );

    await t.step('resolveByName - should return the latest record for a given name', async () => {
      const result = await resolveByName('Repo Test Character', 'character');
      assertEquals(result.isOk(), true);
      if (result.isOk()) {
        const data = result.value as CharacterEntity;
        assertEquals(data?.characterId, charId);
        assertEquals(data?.securityStatus, 4.5);
      }
    });

    await t.step('resolveById - should return null if not found', async () => {
      const result = await resolveById(999999, 'character');
      assertEquals(result.isOk(), true);
      if (result.isOk()) {
        assertEquals(result.value, null);
      }
    });
  } finally {
    // Cleanup
    await db.delete(schema.characterEphemeral).where(
      eq(schema.characterEphemeral.characterId, charId),
    );
    await db.delete(schema.characterStatic).where(eq(schema.characterStatic.characterId, charId));
    await client.end();
  }
});
