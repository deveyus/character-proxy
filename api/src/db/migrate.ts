
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { client, db, ensureDatabaseExists } from "./client.ts";

async function main() {
  console.log("Ensuring database exists...");
  await ensureDatabaseExists();

  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./api/src/db/migrations" });
  
  console.log("Migrations complete.");
  await client.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  Deno.exit(1);
});
