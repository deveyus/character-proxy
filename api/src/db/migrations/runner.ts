import { sql } from '../client.ts';
import { Err, Ok, Result } from 'ts-results-es';
import { logger } from '../../utils/logger.ts';
import { Migration } from './types.ts';

const VERSION_KEY = 'db_version';

/**
 * Ensures the system_state table exists.
 */
async function ensureMigrationTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS system_state (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;
}

/**
 * Gets the current database version from system_state.
 */
async function getCurrentVersion(): Promise<number> {
  const rows = await sql`
    SELECT value FROM system_state WHERE key = ${VERSION_KEY}
  `;
  if (rows.length === 0) return 0;
  return (rows[0].value as { version: number }).version;
}

/**
 * Updates the database version in system_state.
 */
// deno-lint-ignore no-explicit-any
async function setVersion(version: number, tx: any): Promise<void> {
  await tx`
    INSERT INTO system_state (key, value, updated_at)
    VALUES (${VERSION_KEY}, ${sql.json({ version })}, NOW())
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      updated_at = EXCLUDED.updated_at
  `;
}

/**
 * Verifies that the physical database structure matches the expected state for the current version.
 */
async function verifyPhysicalStructure(version: number): Promise<Result<void, Error>> {
  if (version === 0) return Ok(void 0);

  // For version 1+, we expect at least the core tables to exist
  const coreTables = [
    'character_static',
    'character_ephemeral',
    'corporation_static',
    'corporation_ephemeral',
    'alliance_static',
    'alliance_ephemeral',
    'discovery_queue',
    'api_keys',
  ];

  const rows = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ${sql(coreTables)}
  `;

  if (rows.length < coreTables.length) {
    const missing = coreTables.filter(t => !rows.some(r => r.table_name === t));
    return Err(new Error(`Database version is ${version}, but missing core tables: ${missing.join(', ')}`));
  }

  return Ok(void 0);
}

/**
 * Runs all pending migrations.
 */
export async function runMigrations(migrations: Migration[]): Promise<Result<void, Error>> {
  try {
    await ensureMigrationTable();
    const currentVersion = await getCurrentVersion();
    
    // Physical Guard: Verify structure matches claimed version
    const verification = await verifyPhysicalStructure(currentVersion);
    if (verification.isErr()) {
      logger.error('DB', `Physical verification failed: ${verification.error.message}`);
      return verification;
    }

    // Filter and sort pending migrations
    const pending = migrations
      .filter((m) => m.version > currentVersion)
      .sort((a, b) => a.version - b.version);

    if (pending.length === 0) {
      logger.info('DB', 'No pending migrations.');
      return Ok(void 0);
    }

    logger.info('DB', `Found ${pending.length} pending migrations. Current version: ${currentVersion}`);

    for (const migration of pending) {
      logger.info('DB', `Applying migration ${migration.version}: ${migration.description}`);
      
      await sql.begin(async (tx) => {
        await migration.up(tx);
        await setVersion(migration.version, tx);
      });
      
      logger.info('DB', `Migration ${migration.version} applied successfully.`);
    }

    return Ok(undefined);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('DB', `Migration runner failed: ${err.message}`, { error: err });
    return Err(err);
  }
}