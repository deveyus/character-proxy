import { assertEquals } from 'std/assert/mod.ts';
import { client, db, initializeDatabase } from '../../src/db/client.ts';
import * as schema from '../../src/db/schema.ts';
import { eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { resolveById, resolveByName } from '../../src/db/character.ts';

Deno.test('Character DB Module', async (t) => {
  await initializeDatabase();

  const charId = 211201;
  const corpId = 1000002;

  // Setup test data
  await db.insert(schema.characterStatic).values({
    characterId: charId,
    name: 'Char Test Character',
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

  await db.insert(schema.characterEphemeral).values({
    recordId: uuidv7(),
    characterId: charId,
    corporationId: corpId,
    securityStatus: 4.5,
    recordedAt: new Date(), // Now
  });

  try {
    await t.step(
      'resolveById - should return the latest record joined with static data',
      async () => {
        const result = await resolveById(charId);
        assertEquals(result.isOk(), true);
        if (result.isOk()) {
          const data = result.value;
          assertEquals(data?.name, 'Char Test Character');
          assertEquals(data?.securityStatus, 4.5);
        }
      },
    );

    await t.step('resolveByName - should return the latest record for a given name', async () => {
      const result = await resolveByName('Char Test Character');
      assertEquals(result.isOk(), true);
      if (result.isOk()) {
        const data = result.value;
        assertEquals(data?.characterId, charId);
        assertEquals(data?.securityStatus, 4.5);
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
