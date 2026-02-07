import { assertEquals } from 'std/assert/mod.ts';
import { sql } from '../../src/db/client.ts';
import { runMigrations } from '../../src/db/migrations/runner.ts';
import { runAlignmentGuards } from '../../src/db/migrations/alignment.ts';
import { setupLogger } from '../../src/utils/logger.ts';

Deno.test('Migration System Regression', async (t) => {
  await setupLogger();

  await t.step('should bootstrap from an empty schema', async () => {
    // 1. Nuke
    await sql.unsafe(`DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;`);
    
    // 2. Run migrations (Grand Baseline)
    const { migration: v1 } = await import('../../src/db/migrations/001_grand_baseline.ts');
    const result = await runMigrations([v1]);
    assertEquals(result.isOk(), true);
    
    // 3. Verify version
    const versionRow = await sql`SELECT value FROM system_state WHERE key = 'db_version'`;
    assertEquals((versionRow[0].value as { version: number }).version, 1);
  });

  await t.step('should apply incremental migrations', async () => {
    const v2 = {
      version: 2,
      description: 'Incremental test',
      // deno-lint-ignore no-explicit-any
      up: async (tx: any) => {
        await tx`CREATE TABLE _inc_test (id INT)`;
      }
    };
    
    const result = await runMigrations([v2]);
    assertEquals(result.isOk(), true);
    
    const versionRow = await sql`SELECT value FROM system_state WHERE key = 'db_version'`;
    assertEquals((versionRow[0].value as { version: number }).version, 2);
    
    const tableCheck = await sql`SELECT 1 FROM information_schema.tables WHERE table_name = '_inc_test'`;
    assertEquals(tableCheck.length, 1);
  });

  await t.step('should pass alignment guards when synchronized', async () => {
    const result = await runAlignmentGuards();
    assertEquals(result.isOk(), true);
  });

  await t.step('should fail alignment guards on drift', async () => {
    // Simulate drift by renaming a column
    await sql`ALTER TABLE character_static RENAME COLUMN name TO renamed_name`;
    
    const result = await runAlignmentGuards();
    assertEquals(result.isErr(), true);
    if (result.isErr()) {
      assertEquals(result.error.message.includes('missing columns'), true);
    }
    
    // Cleanup drift for other tests
    await sql`ALTER TABLE character_static RENAME COLUMN renamed_name TO name`;
  });

  // Final cleanup
  await sql.end();
});