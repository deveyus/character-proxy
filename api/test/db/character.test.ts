import { assertEquals } from 'std/assert/mod.ts';
import { initializeDatabase, sql } from '../../src/db/client.ts';
import { uuidv7 } from 'uuidv7';
import { resolveById, resolveByName } from '../../src/db/character.ts';

Deno.test('Character DB Module', async (t) => {
  await initializeDatabase();

  const charId = 211201;
  const corpId = 1000002;

  // Setup test data
  await sql`
    INSERT INTO character_static (character_id, name, birthday, gender, race_id, bloodline_id)
    VALUES (${charId}, 'Char Test Character', ${new Date()}, 'male', 1, 1)
    ON CONFLICT (character_id) DO NOTHING
  `;

  await sql`
    INSERT INTO character_ephemeral (record_id, character_id, corporation_id, security_status, recorded_at)
    VALUES (${uuidv7()}, ${charId}, ${corpId}, 5.0, ${new Date(Date.now() - 10000)})
  `;

  await sql`
    INSERT INTO character_ephemeral (record_id, character_id, corporation_id, security_status, recorded_at)
    VALUES (${uuidv7()}, ${charId}, ${corpId}, 4.5, ${new Date()})
  `;

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
    await sql`DELETE FROM character_ephemeral WHERE character_id = ${charId}`;
    await sql`DELETE FROM character_static WHERE character_id = ${charId}`;
    await sql.end();
  }
});
