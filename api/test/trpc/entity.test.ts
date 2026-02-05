import { assertEquals } from 'std/assert/mod.ts';
import { appRouter } from '../../src/trpc/router.ts';
import { createTRPCContext } from '../../src/trpc/context.ts';
import { client, db, initializeDatabase } from '../../src/db/client.ts';
import * as schema from '../../src/db/schema.ts';
import { eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { CharacterEntity } from '../../src/db/repos/entity.repo.ts';

Deno.test('tRPC Entity Procedures', async (t) => {
  await initializeDatabase();
  const ctx = createTRPCContext();
  const caller = appRouter.createCaller(ctx);

  const charId = 211202;
  const name = 'tRPC Test Character';

  // Setup test data
  await db.insert(schema.characterStatic).values({
    characterId: charId,
    name: name,
    birthday: new Date(),
    gender: 'female',
    raceId: 1,
    bloodlineId: 1,
  }).onConflictDoNothing();

  await db.insert(schema.characterEphemeral).values({
    recordId: uuidv7(),
    characterId: charId,
    corporationId: 1000001,
    securityStatus: 5.0,
    recordedAt: new Date(),
  });

  try {
    await t.step('resolveById - should return entity via tRPC', async () => {
      const entity = await caller.resolveById({ id: charId, type: 'character' });
      assertEquals(entity?.name, name);
      assertEquals((entity as CharacterEntity)?.characterId, charId);
    });

    await t.step('resolveByName - should return entity via tRPC', async () => {
      const entity = await caller.resolveByName({ name: name, type: 'character' });
      assertEquals(entity?.name, name);
      assertEquals((entity as CharacterEntity)?.characterId, charId);
    });

    await t.step('resolveById - should return null for non-existent', async () => {
      const entity = await caller.resolveById({ id: 999999, type: 'character' });
      assertEquals(entity, null);
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
