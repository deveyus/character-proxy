import { assertEquals } from 'std/assert/mod.ts';
import { client, db, initializeDatabase } from '../../src/db/client.ts';
import * as schema from '../../src/db/schema.ts';
import { eq } from 'drizzle-orm';

Deno.test('Entity Schema', async (t) => {
  // Setup: Ensure DB exists and schema is migrated
  await initializeDatabase();

  await t.step('should insert and retrieve a character', async () => {
    const charId = 90000001;
    const corpId = 10000001;

    // Clean up if exists
    await db.delete(schema.characterEphemeral).where(
      eq(schema.characterEphemeral.characterId, charId),
    );
    await db.delete(schema.characterStatic).where(eq(schema.characterStatic.id, charId));

    // Insert Static
    await db.insert(schema.characterStatic).values({
      id: charId,
      name: 'Test Character',
      birthday: new Date('2020-01-01T00:00:00Z'),
    });

    // Insert Ephemeral
    await db.insert(schema.characterEphemeral).values({
      characterId: charId,
      corporationId: corpId,
      securityStatus: 5.0,
    });

    // Retrieve
    const [retrievedStatic] = await db.select().from(schema.characterStatic).where(
      eq(schema.characterStatic.id, charId),
    );
    const [retrievedEphemeral] = await db.select().from(schema.characterEphemeral).where(
      eq(schema.characterEphemeral.characterId, charId),
    );

    assertEquals(retrievedStatic.name, 'Test Character');
    assertEquals(retrievedEphemeral.corporationId, corpId);
    assertEquals(retrievedEphemeral.securityStatus, 5.0);
  });

  await t.step('should insert and retrieve a corporation', async () => {
    const corpId = 10000002;

    // Clean up
    await db.delete(schema.corporationEphemeral).where(
      eq(schema.corporationEphemeral.corporationId, corpId),
    );
    await db.delete(schema.corporationStatic).where(eq(schema.corporationStatic.id, corpId));

    // Insert Static
    await db.insert(schema.corporationStatic).values({
      id: corpId,
      name: 'Test Corporation',
      ticker: 'TTEST',
    });

    // Insert Ephemeral
    await db.insert(schema.corporationEphemeral).values({
      corporationId: corpId,
      memberCount: 100,
    });

    const [retrievedStatic] = await db.select().from(schema.corporationStatic).where(
      eq(schema.corporationStatic.id, corpId),
    );
    assertEquals(retrievedStatic.name, 'Test Corporation');
  });

  await t.step('should insert and retrieve an alliance', async () => {
    const allianceId = 50000001;

    // Clean up
    await db.delete(schema.allianceEphemeral).where(
      eq(schema.allianceEphemeral.allianceId, allianceId),
    );
    await db.delete(schema.allianceStatic).where(eq(schema.allianceStatic.id, allianceId));

    // Insert Static
    await db.insert(schema.allianceStatic).values({
      id: allianceId,
      name: 'Test Alliance',
      ticker: 'TALLI',
    });

    // Insert Ephemeral
    await db.insert(schema.allianceEphemeral).values({
      allianceId: allianceId,
      memberCount: 1000,
    });

    const [retrievedStatic] = await db.select().from(schema.allianceStatic).where(
      eq(schema.allianceStatic.id, allianceId),
    );
    assertEquals(retrievedStatic.name, 'Test Alliance');
  });

  // Teardown: Close connection to prevent leaks
  await client.end();
});
