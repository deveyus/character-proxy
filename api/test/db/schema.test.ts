import { assertEquals } from "std/assert/mod.ts";
import { client, db, initializeDatabase } from "../../src/db/client.ts";
import * as schema from "../../src/db/schema.ts";
import { eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";

Deno.test("Entity Schema", async (t) => {
  // Setup: Ensure DB exists and schema is migrated
  await initializeDatabase();

  await t.step("should insert and retrieve a character with all fields", async () => {
    const charId = 90000001;
    const corpId = 10000001;

    // Clean up if exists
    await db.delete(schema.characterEphemeral).where(eq(schema.characterEphemeral.characterId, charId));
    await db.delete(schema.characterStatic).where(eq(schema.characterStatic.characterId, charId));

    // Insert Static
    await db.insert(schema.characterStatic).values({
      characterId: charId,
      name: "Test Character",
      birthday: new Date("2020-01-01T00:00:00Z"),
      gender: "female",
      raceId: 1,
      bloodlineId: 1,
    });

    // Insert Ephemeral
    await db.insert(schema.characterEphemeral).values({
      recordId: uuidv7(),
      characterId: charId,
      corporationId: corpId,
      securityStatus: 5.0,
    });

    // Retrieve
    const [retrievedStatic] = await db.select().from(schema.characterStatic).where(eq(schema.characterStatic.characterId, charId));
    const [retrievedEphemeral] = await db.select().from(schema.characterEphemeral).where(eq(schema.characterEphemeral.characterId, charId));

    assertEquals(retrievedStatic.name, "Test Character");
    assertEquals(retrievedStatic.gender, "female");
    assertEquals(retrievedEphemeral.corporationId, corpId);
    assertEquals(retrievedEphemeral.securityStatus, 5.0);
  });

  await t.step("should insert and retrieve a corporation with all fields", async () => {
    const corpId = 10000002;

    // Clean up
    await db.delete(schema.corporationEphemeral).where(eq(schema.corporationEphemeral.corporationId, corpId));
    await db.delete(schema.corporationStatic).where(eq(schema.corporationStatic.corporationId, corpId));

    // Insert Static
    await db.insert(schema.corporationStatic).values({
      corporationId: corpId,
      name: "Test Corporation",
      ticker: "TTEST",
      dateFounded: new Date("2010-01-01T00:00:00Z"),
      creatorId: 90000002,
    });

    // Insert Ephemeral
    await db.insert(schema.corporationEphemeral).values({
      recordId: uuidv7(),
      corporationId: corpId,
      ceoId: 90000002,
      memberCount: 100,
    });

    const [retrievedStatic] = await db.select().from(schema.corporationStatic).where(eq(schema.corporationStatic.corporationId, corpId));
    const [retrievedEphemeral] = await db.select().from(schema.corporationEphemeral).where(eq(schema.corporationEphemeral.corporationId, corpId));
    
    assertEquals(retrievedStatic.name, "Test Corporation");
    assertEquals(retrievedStatic.creatorId, 90000002);
    assertEquals(retrievedEphemeral.ceoId, 90000002);
  });

  await t.step("should insert and retrieve an alliance with all fields", async () => {
    const allianceId = 50000001;

    // Clean up
    await db.delete(schema.allianceEphemeral).where(eq(schema.allianceEphemeral.allianceId, allianceId));
    await db.delete(schema.allianceStatic).where(eq(schema.allianceStatic.allianceId, allianceId));

    // Insert Static
    await db.insert(schema.allianceStatic).values({
      allianceId: allianceId,
      name: "Test Alliance",
      ticker: "TALLI",
      dateFounded: new Date("2005-01-01T00:00:00Z"),
      creatorId: 90000003,
      creatorCorporationId: 10000003,
    });

    // Insert Ephemeral
    await db.insert(schema.allianceEphemeral).values({
      recordId: uuidv7(),
      allianceId: allianceId,
      memberCount: 1000,
      executorCorpId: 10000003,
    });

    const [retrievedStatic] = await db.select().from(schema.allianceStatic).where(eq(schema.allianceStatic.allianceId, allianceId));
    assertEquals(retrievedStatic.name, "Test Alliance");
    assertEquals(retrievedStatic.creatorId, 90000003);
  });

  // Teardown: Close connection to prevent leaks
  await client.end();
});