import { assertEquals } from 'std/assert/mod.ts';
import { client, db, initializeDatabase } from '../../src/db/client.ts';
import { sql } from 'drizzle-orm';

Deno.test('Database Connection', async (t) => {
  // Setup: Ensure DB exists and schema is migrated
  await initializeDatabase();

  await t.step('should execute a simple query', async () => {
    const result = await db.execute(sql`SELECT 1 as res`);
    assertEquals(result[0].res, 1);
  });

  // Teardown: Close connection to prevent leaks
  await client.end();
});
