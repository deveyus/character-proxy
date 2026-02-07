import postgres from 'postgres';
import { Err, Ok, Result } from 'ts-results-es';
import { logger } from '../utils/logger.ts';
import { runMigrations } from './migrations/runner.ts';
import { migration as v1 } from './migrations/001_grand_baseline.ts';
import { runAlignmentGuards } from './migrations/alignment.ts';

// Configuration
const DB_NAME = 'character_proxy';
const connectionString = Deno.env.get('DATABASE_URL');
const workerCount = parseInt(Deno.env.get('WORKER_COUNT') || '1');

// Primary client for the application
// We scale the pool size based on workers + a buffer for tRPC requests
const MAX_POOL_SIZE = Math.max(10, workerCount + 10);

/**
 * Primary PostgreSQL client instance using postgres.js.
 *
 * Performance: Medium -- DB Connection
 * Uses a connection pool scaled based on the configured WORKER_COUNT.
 */
export const sql = connectionString
  ? postgres(connectionString, { max: MAX_POOL_SIZE })
  : postgres({
    database: DB_NAME,
    max: MAX_POOL_SIZE,
  });

/**
 * Type alias for the database client or a transaction context.
 */
export type Tx = typeof sql;

/**
 * Legacy compatibility alias for the database client.
 * @deprecated Use `sql` directly for Raw SQL queries.
 */
// deno-lint-ignore no-explicit-any
export const db = sql as any;

/**
 * Bootstraps the database, ensuring schema exists and migrations are current.
 *
 * Side-Effects:
 * - Creates the target database if missing (on local connections).
 * - Executes pending TypeScript migrations.
 * - Runs Zod Alignment Guards to verify schema integrity.
 *
 * Performance: High -- DB Init
 * Should only be called once during application startup.
 *
 * @returns {Promise<Result<void, Error>>} Success or a combined initialization error.
 */
export async function initializeDatabase(): Promise<Result<void, Error>> {
  const dbResult = await ensureDatabaseExists();
  if (dbResult.isErr()) return dbResult;

  logger.info('DB', 'Initializing database schema...');

  // In a real multi-file system, we'd dynamic import these,
  // but for now we list them explicitly.
  const migrations = [v1];

  const migrationResult = await runMigrations(migrations);
  if (migrationResult.isErr()) return migrationResult;

  // Run integrity guards
  const alignmentResult = await runAlignmentGuards();
  if (alignmentResult.isErr()) return alignmentResult;

  logger.info('DB', 'Database initialization and integrity checks complete.');
  return Ok(undefined);
}

async function ensureDatabaseExists(): Promise<Result<void, Error>> {
  if (connectionString) return Ok(undefined);

  const adminClient = postgres({ database: 'postgres' });

  const result = await adminClient`
    SELECT 1 FROM pg_database WHERE datname = ${DB_NAME}
  `.then((res) => Ok(res)).catch((e) => Err(e instanceof Error ? e : new Error(String(e))));

  if (result.isErr()) {
    await adminClient.end();
    return result;
  }

  if (result.value.length === 0) {
    logger.info('DB', `Database '${DB_NAME}' not found. Creating...`);
    const createResult = await adminClient.unsafe(`CREATE DATABASE "${DB_NAME}"`)
      .then((res) => Ok(res)).catch((e) => Err(e instanceof Error ? e : new Error(String(e))));

    if (createResult.isErr()) {
      await adminClient.end();
      return createResult;
    }
  }

  await adminClient.end();
  return Ok(undefined);
}

if (import.meta.main) {
  const result = await initializeDatabase();
  if (result.isErr()) {
    logger.error('DB', `Initialization failed: ${result.error.message}`, { error: result.error });
    Deno.exit(1);
  }
  await sql.end();
  Deno.exit(0);
}
