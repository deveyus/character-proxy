import { assertEquals } from 'std/assert/mod.ts';
import { initializeDatabase, sql } from '../../src/db/client.ts';
import { uuidv7 } from 'uuidv7';

Deno.test('Entity Schema', async (t) => {
  // Setup: Ensure DB exists and schema is migrated
  await initializeDatabase();

  await t.step('should insert and retrieve a character with all fields', async () => {
    const charId = 90000001;
    const corpId = 10000001;

    // Clean up if exists
    await sql`DELETE FROM character_ephemeral WHERE character_id = ${charId}`;
    await sql`DELETE FROM character_static WHERE character_id = ${charId}`;

    // Insert Static
    await sql`
      INSERT INTO character_static (character_id, name, birthday, gender, race_id, bloodline_id)
      VALUES (${charId}, 'Test Character', ${new Date('2020-01-01T00:00:00Z')}, 'female', 1, 1)
    `;

    // Insert Ephemeral
    await sql`
      INSERT INTO character_ephemeral (record_id, character_id, corporation_id, security_status)
      VALUES (${uuidv7()}, ${charId}, ${corpId}, 5.0)
    `;

    // Retrieve
    const retrievedStatic =
      await sql`SELECT * FROM character_static WHERE character_id = ${charId}`;
    const retrievedEphemeral =
      await sql`SELECT * FROM character_ephemeral WHERE character_id = ${charId}`;

    assertEquals(retrievedStatic[0].name, 'Test Character');
    assertEquals(retrievedStatic[0].gender, 'female');
    assertEquals(Number(retrievedEphemeral[0].corporation_id), corpId);
    assertEquals(retrievedEphemeral[0].security_status, 5.0);
  });

  await t.step('should insert and retrieve a corporation with all fields', async () => {
    const corpId = 10000002;

    // Clean up
    await sql`DELETE FROM corporation_ephemeral WHERE corporation_id = ${corpId}`;
    await sql`DELETE FROM corporation_static WHERE corporation_id = ${corpId}`;

    // Insert Static
    await sql`
      INSERT INTO corporation_static (corporation_id, name, ticker, date_founded, creator_id)
      VALUES (${corpId}, 'Test Corporation', 'TTEST', ${new Date('2010-01-01T00:00:00Z')}, 90000002)
    `;

    // Insert Ephemeral
    await sql`
      INSERT INTO corporation_ephemeral (record_id, corporation_id, ceo_id, member_count)
      VALUES (${uuidv7()}, ${corpId}, 90000002, 100)
    `;

    const retrievedStatic =
      await sql`SELECT * FROM corporation_static WHERE corporation_id = ${corpId}`;
    const retrievedEphemeral =
      await sql`SELECT * FROM corporation_ephemeral WHERE corporation_id = ${corpId}`;

    assertEquals(retrievedStatic[0].name, 'Test Corporation');
    assertEquals(Number(retrievedStatic[0].creator_id), 90000002);
    assertEquals(Number(retrievedEphemeral[0].ceo_id), 90000002);
  });

  await t.step('should insert and retrieve an alliance with all fields', async () => {
    const allianceId = 50000001;

    // Clean up
    await sql`DELETE FROM alliance_ephemeral WHERE alliance_id = ${allianceId}`;
    await sql`DELETE FROM alliance_static WHERE alliance_id = ${allianceId}`;

    // Insert Static
    await sql`
      INSERT INTO alliance_static (alliance_id, name, ticker, date_founded, creator_id, creator_corporation_id)
      VALUES (${allianceId}, 'Test Alliance', 'TALLI', ${new Date(
      '2005-01-01T00:00:00Z',
    )}, 90000003, 10000003)
    `;

    // Insert Ephemeral
    await sql`
      INSERT INTO alliance_ephemeral (record_id, alliance_id, member_count, executor_corp_id)
      VALUES (${uuidv7()}, ${allianceId}, 1000, 10000003)
    `;

    const retrievedStatic =
      await sql`SELECT * FROM alliance_static WHERE alliance_id = ${allianceId}`;
    assertEquals(retrievedStatic[0].name, 'Test Alliance');
    assertEquals(Number(retrievedStatic[0].creator_id), 90000003);
  });

  // Teardown: Close connection to prevent leaks
  await sql.end();
});
