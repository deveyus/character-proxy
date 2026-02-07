import { assertEquals, assertNotEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { initializeDatabase, sql } from '../../src/db/client.ts';
import * as characterService from '../../src/services/character.ts';
import { processQueueItem } from '../../src/services/discovery/worker.ts';
import { setupLogger } from '../../src/utils/logger.ts';

Deno.test('Discovery Integration', async (t) => {
  await setupLogger();
  // Setup: Ensure DB exists and schema is migrated
  await initializeDatabase();
  console.log('DEBUG: initializeDatabase completed');
  // Cleanup
  await sql`DELETE FROM discovery_queue`;
  await sql`DELETE FROM character_ephemeral WHERE character_id = 2112024646`;
  await sql`DELETE FROM character_static WHERE character_id = 2112024646`;
  await sql`DELETE FROM corporation_ephemeral WHERE corporation_id = 1000135`;
  await sql`DELETE FROM corporation_static WHERE corporation_id = 1000135`;

  await t.step('fetching a character should queue their corporation', async () => {
    const result = await characterService.getById(2112024646); // CCP Foxfour
    if (result.isErr()) throw result.error;

    // Small delay to allow async extractFromCharacter to finish
    await new Promise((resolve) => setTimeout(resolve, 500));

    const queued = await sql`
      SELECT * FROM discovery_queue
      WHERE entity_type = 'corporation'
    `;

    assertNotEquals(queued.length, 0, 'Corporation should be queued');
  });

  await t.step('processing the queue should fetch the corporation', async () => {
    const queued = await sql`
      SELECT * FROM discovery_queue
      WHERE entity_type = 'corporation' AND locked_until IS NULL
      LIMIT 1
    `;

    const targetCorpId = Number(queued[0].entity_id);
    // Process one item
    const processed = await processQueueItem();
    assertEquals(processed.isOk(), true);

    const corp = await sql`
      SELECT * FROM corporation_static
      WHERE corporation_id = ${targetCorpId}
    `;
    assertNotEquals(corp.length, 0, 'Corporation should now be in static DB');
  });

  // Close DB connection
  await sql.end();
});