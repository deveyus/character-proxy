
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "npm:drizzle-orm@^0.39.1/postgres-js/migrator";
import postgres from "postgres";
import { join, fromFileUrl, dirname } from "std/path/mod.ts";

// Configuration
const DB_NAME = "character_proxy";
const connectionString = Deno.env.get("DATABASE_URL");

// Primary client for the application
export const client = connectionString
  ? postgres(connectionString)
  : postgres({
    database: DB_NAME,
  });

export const db = drizzle(client);

/**
 * Ensures the database exists and all migrations are applied.
 * This should be called at application startup.
 */
export async function initializeDatabase() {
  await ensureDatabaseExists();
  
  const __dirname = dirname(fromFileUrl(import.meta.url));
  const migrationsFolder = join(__dirname, "migrations");

  console.log("Checking/Running migrations...");
  await migrate(db, { migrationsFolder });
  console.log("Database initialized and schema up-to-date.");
}

async function ensureDatabaseExists() {
  if (connectionString) return;

  const adminClient = postgres({ database: "postgres" });

  try {
    const result = await adminClient`
      SELECT 1 FROM pg_database WHERE datname = ${DB_NAME}
    `;

    if (result.length === 0) {
      console.log(`Database '${DB_NAME}' not found. Creating...`);
      await adminClient.unsafe(`CREATE DATABASE "${DB_NAME}"`);
    }
  } catch (error) {
    console.error("Failed to check/create database:", error);
    throw error;
  } finally {
    await adminClient.end();
  }
}

