
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Configuration
const DB_NAME = "character_proxy";
// If DATABASE_URL is set, we assume it's the full connection string.
// Otherwise we rely on PGHOST/PGUSER defaults (e.g. from flake.nix)
const connectionString = Deno.env.get("DATABASE_URL");

// Primary client for the application
export const client = connectionString
  ? postgres(connectionString)
  : postgres({
    database: DB_NAME,
  });

export const db = drizzle(client);

/**
 * Checks if the target database exists and creates it if it doesn't.
 * This should be called at application startup.
 */
export async function ensureDatabaseExists() {
  if (connectionString) {
    // If a full connection string is provided, we assume the DB is managed externally
    // or the string is sufficient. Parsing it to switch DBs is brittle.
    return;
  }

  // Connect to default 'postgres' db to perform administrative tasks
  const adminClient = postgres({
    database: "postgres",
  });

  try {
    const result = await adminClient`
      SELECT 1 FROM pg_database WHERE datname = ${DB_NAME}
    `;

    if (result.length === 0) {
      console.log(`Database '${DB_NAME}' not found. Creating...`);
      // Cannot use parameterized query for database name in CREATE DATABASE
      await adminClient.unsafe(`CREATE DATABASE "${DB_NAME}"`);
      console.log(`Database '${DB_NAME}' created successfully.`);
    }
  } catch (error) {
    console.error("Failed to check/create database:", error);
    throw error;
  } finally {
    await adminClient.end();
  }
}

