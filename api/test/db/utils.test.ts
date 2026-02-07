import { assertEquals } from 'std/assert/mod.ts';
import { initializeDatabase, sql } from '../../src/db/client.ts';
import { findEntityGaps } from '../../src/db/utils.ts';

Deno.test('DB Utils - findEntityGaps', async (t) => {
  await initializeDatabase();

  // Clear existing data to have a predictable test state
  await sql`DELETE FROM character_ephemeral`;
  await sql`DELETE FROM character_static`;

  // Insert IDs with gaps: 100, 105, 110
  const now = new Date();
  await sql`
    INSERT INTO character_static (character_id, name, birthday, gender, race_id, bloodline_id)
    VALUES 
      (100, 'Char 100', ${now}, 'male', 1, 1),
      (105, 'Char 105', ${now}, 'male', 1, 1),
      (110, 'Char 110', ${now}, 'male', 1, 1)
  `;

  await t.step('should identify gaps between 100-105 and 105-110', async () => {
    const result = await findEntityGaps('character');
    assertEquals(result.isOk(), true);
    if (result.isOk()) {
      const gaps = result.value;
      // Sorted by ID DESC, so 106-109 should be first
      assertEquals(gaps.length, 2);
      
      assertEquals(gaps[0].startId, 106);
      assertEquals(gaps[0].endId, 109);
      assertEquals(gaps[0].gapSize, 4);

      assertEquals(gaps[1].startId, 101);
      assertEquals(gaps[1].endId, 104);
      assertEquals(gaps[1].gapSize, 4);
    }
  });

  // Cleanup
  await sql`DELETE FROM character_static WHERE character_id IN (100, 105, 110)`;
  await sql.end();
});
