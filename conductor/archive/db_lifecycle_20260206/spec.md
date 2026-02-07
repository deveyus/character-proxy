# Specification: Database Lifecycle Management

## Overview

Implement a self-contained database initialization and migration system within the Deno application. This system replaces the "nuke-and-replace" strategy with versioned, chained migrations defined in TypeScript, ensuring data persistence and schema integrity across updates.

## Functional Requirements

1. **Migration Registry:**
   - Store individual migrations in `api/src/db/migrations/` as TypeScript files (e.g., `001_grand_baseline.ts`).
   - Each migration must export a standard interface: `version`, `description`, and an `up` function.
2. **Version Tracking:**
   - Store the current database version in the `system_state` table (key: `db_version`).
3. **Migration Runner:**
   - On startup (or via task), the runner compares the current `db_version` with the available migration files.
   - Migrations must be applied sequentially in a single transaction per migration.
4. **Integrity Guards:**
   - **Physical Reflection:** Before applying a migration, reflect the current DB structure via `information_schema` to ensure it matches the expected state for the current version.
   - **Zod Alignment Guard:** After migrations are applied, verify that the resulting database structure matches the entity Zod schemas defined in the codebase. Fail startup if drift is detected.
5. **Grand Baseline:**
   - Consolidate all existing table definitions (Characters, Corps, Alliances, Queue, API Keys, System State) into `001_grand_baseline.ts`.

## Non-Functional Requirements

- **Idempotency:** The runner should be safe to call multiple times; it only acts if the code version is higher than the DB version.
- **Atomic Updates:** If any part of a migration fails, the entire transaction must roll back, leaving the `db_version` unchanged.
- **Zero-Trust:** Validation must occur before and after schema changes to prevent data corruption.

## Acceptance Criteria

- `api/src/db/migrations/*.sql` files are removed.
- Running the application on an empty database automatically constructs the entire schema.
- Manually changing a column name in the DB causes the application to fail the "Alignment Guard" on startup.
- New schema changes can be applied simply by adding a new `.ts` file to the migrations directory.

## Out of Scope

- Automated "down" (rollback) migrations (the "nuke" strategy is the fallback during major dev breakages).
- Support for database engines other than PostgreSQL.
