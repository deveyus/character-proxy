
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./api/src/db/schema.ts",
  out: "./api/src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: Deno.env.get("DATABASE_URL") || "postgres://localhost:5432/character_proxy",
  },
});
