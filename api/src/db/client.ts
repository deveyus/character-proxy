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

export const sql = connectionString
  ? postgres(connectionString, { max: MAX_POOL_SIZE })
  : postgres({
    database: DB_NAME,
    max: MAX_POOL_SIZE,
  });

/**
 * Migration runner using Raw SQL.
 * IMPLEMENTS "NUKE-AND-REPLACE" STRATEGY.
 */
export async function initializeDatabase(): Promise<Result<void, Error>> {
  const dbResult = await ensureDatabaseExists();
  if (dbResult.isErr()) return dbResult;

  const __dirname = dirname(fromFileUrl(import.meta.url));
  const migrationsFolder = join(__dirname, 'migrations');

  logger.info('DB', 'RESETTING DATABASE (Nuke-and-Replace)...');

  try {
    // 1. Nuke existing schema
    await sql`DROP SCHEMA public CASCADE`;
    await sql`CREATE SCHEMA public`;
    await sql`GRANT ALL ON SCHEMA public TO public`;

    // 2. List all .sql files in the migrations directory
    const files = [];
    for await (const entry of Deno.readDir(migrationsFolder)) {
      if (entry.isFile && entry.name.endsWith('.sql')) {
        files.push(entry.name);
      }
    }

    // Sort files to ensure they run in order (0000, 0001, etc.)
    files.sort();

    // 3. Execute each migration file
    for (const file of files) {
      const content = await Deno.readTextFile(join(migrationsFolder, file));
      logger.info('DB', `Applying migration: ${file}`);
      // Migration files from Drizzle might contain multiple statements
      // postgres.js unsafe() can handle multiple statements if separated by semicolons
      await sql.unsafe(content);
    }

    // 4. Manually ensure constraints that might be missing from Drizzle's initial .sql files
    // (Drizzle sometimes handles PKs via internal metadata instead of explicit SQL in early migrations)
    try {
      await sql`ALTER TABLE discovery_queue ADD PRIMARY KEY (entity_id, entity_type)`;
    } catch (err) {
      logger.info('DB', `Note: Could not add PK to discovery_queue (might already exist): ${(err as Error).message}`);
    }

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
  await sql.end();
  Deno.exit(0);
}