import postgres from 'postgres';
import { Err, Ok, Result } from 'ts-results-es';
import { logger } from '../utils/logger.ts';
import { runMigrations } from './migrations/runner.ts';
import { migration as v1 } from './migrations/001_grand_baseline.ts';

// Configuration
const DB_NAME = 'character_proxy';
const connectionString = Deno.env.get('DATABASE_URL');
const workerCount = parseInt(Deno.env.get('WORKER_COUNT') || '1');

// Primary client for the application
// We scale the pool size based on workers + a buffer for tRPC requests
const MAX_POOL_SIZE = Math.max(10, workerCount + 10);

export const sql = connectionString
  ? postgres(connectionString, { max: MAX_POOL_SIZE })
  : postgres({
    database: DB_NAME,
    max: MAX_POOL_SIZE,
  });

// deno-lint-ignore no-explicit-any
export const db = sql as any;

/**
 * Ensures the database exists and all migrations are applied.
 * This should be called at application startup.
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

  logger.info('DB', 'Database initialization complete.');
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
