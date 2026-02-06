import { assertEquals, assertNotEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { db } from '../../src/db/client.ts';
import {
  characterEphemeral,
  characterStatic,
  corporationEphemeral,
  corporationStatic,
  discoveryQueue,
} from '../../src/db/schema.ts';
import * as characterService from '../../src/services/character.ts';
import { processQueueItem } from '../../src/services/discovery/worker.ts';
import { and, eq } from 'drizzle-orm';
import { setupLogger } from '../../src/utils/logger.ts';

Deno.test('Discovery Integration', async (t) => {
  await setupLogger();
  // Cleanup
  await db.delete(discoveryQueue);
  await db.delete(characterEphemeral).where(eq(characterEphemeral.characterId, 2112024646));
  await db.delete(characterStatic).where(eq(characterStatic.characterId, 2112024646));
  await db.delete(corporationEphemeral).where(eq(corporationEphemeral.corporationId, 1000135));
  await db.delete(corporationStatic).where(eq(corporationStatic.corporationId, 1000135));

  await t.step('fetching a character should queue their corporation', async () => {
    const result = await characterService.getById(2112024646); // CCP Foxfour
    if (result.isErr()) throw result.error;

    // Small delay to allow async extractFromCharacter to finish
    await new Promise((resolve) => setTimeout(resolve, 500));

    const queued = await db.select().from(discoveryQueue)
      .where(and(eq(discoveryQueue.entityType, 'corporation')));

    assertNotEquals(queued.length, 0, 'Corporation should be queued');
  });

  await t.step('processing the queue should fetch the corporation', async () => {
    const queued = await db.select().from(discoveryQueue)
      .where(
        and(eq(discoveryQueue.entityType, 'corporation'), eq(discoveryQueue.status, 'pending')),
      )
      .limit(1);

    const targetCorpId = queued[0].entityId;

    // Process one item
    const processed = await processQueueItem();
    assertEquals(processed.isOk(), true);

    const corp = await db.select().from(corporationStatic).where(
      eq(corporationStatic.corporationId, targetCorpId),
    );
    assertNotEquals(corp.length, 0, 'Corporation should now be in static DB');
  });

  // Close DB connection
  const { client } = await import('../../src/db/client.ts');
  await client.end();
});
