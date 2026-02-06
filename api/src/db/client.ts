import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'npm:drizzle-orm@^0.39.1/postgres-js/migrator';
import postgres from 'postgres';
import { dirname, fromFileUrl, join } from 'std/path/mod.ts';
import { Err, Ok, Result } from 'ts-results-es';
import { logger } from '../utils/logger.ts';

// Configuration
const DB_NAME = 'character_proxy';
const connectionString = Deno.env.get('DATABASE_URL');
const workerCount = parseInt(Deno.env.get('WORKER_COUNT') || '1');

// Primary client for the application
// We scale the pool size based on workers + a buffer for tRPC requests
const MAX_POOL_SIZE = Math.max(10, workerCount + 10);

export const client = connectionString
  ? postgres(connectionString, { max: MAX_POOL_SIZE })
  : postgres({
    database: DB_NAME,
    max: MAX_POOL_SIZE,
  });

export const db = drizzle(client);

/**
 * Ensures the database exists and all migrations are applied.
 * This should be called at application startup.
 */
export async function initializeDatabase(): Promise<Result<void, Error>> {
  const dbResult = await ensureDatabaseExists();
  if (dbResult.isErr()) return dbResult;

  const __dirname = dirname(fromFileUrl(import.meta.url));
  const migrationsFolder = join(__dirname, 'migrations');

  logger.info('DB', 'Checking/Running migrations...');

  try {
    await migrate(db, { migrationsFolder });
    logger.info('DB', 'Database initialized and schema up-to-date.');
    return Ok(undefined);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
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
    logger.error('DB', `Migration failed: ${result.error.message}`, { error: result.error });
    Deno.exit(1);
  }
  await client.end();
  Deno.exit(0);
}
