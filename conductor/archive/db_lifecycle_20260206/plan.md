# Implementation Plan: Database Lifecycle Management

## Phase 1: Core Migration Engine

- [x] Task: Define Migration Interface and Types efaaa89
  - [x] Create `api/src/db/migrations/types.ts` defining the `Migration` interface (version, description, up).
- [x] Task: Implement Version Tracking and Runner logic bc79041
  - [x] Create `api/src/db/migrations/runner.ts`.
  - [x] Implement `ensureMigrationTable`: Logic to create `system_state` if it doesn't exist (chicken-and-egg problem).
  - [x] Implement `getCurrentVersion`: Retrieve `db_version` from `system_state`.
  - [x] Implement `runMigrations`: Logic to import and apply pending migrations in order, inside a single transaction.
- [x] Task: Conductor - User Manual Verification 'Core Migration Engine' (Protocol in workflow.md) bc79041

## Phase 2: Grand Baseline Implementation

- [x] Task: Create 001 Grand Baseline Migration f12523f
  - [x] Create `api/src/db/migrations/001_grand_baseline.ts`.
  - [x] Port all table creation SQL (Characters, Corps, Alliances, Queue, API Keys, System State) from the archived Drizzle schema.
- [x] Task: Update Database Initialization f12523f
  - [x] Refactor `initializeDatabase` in `api/src/db/client.ts` to call the new migration runner.
  - [x] Remove the "nuke-and-replace" logic.
- [x] Task: Migration Cleanup f12523f
  - [x] Delete `api/src/db/migrations/*.sql` files.
  - [x] Verify that `deno task dev` bootstraps a fresh database correctly.
- [x] Task: Conductor - User Manual Verification 'Grand Baseline Implementation' (Protocol in workflow.md) f12523f

## Phase 3: Integrity & Alignment Guards

- [x] Task: Implement Physical Reflection Guard 28889df
  - [x] In the runner, add a check that queries `information_schema` before migrations.
  - [x] Ensure that for any version > 0, the expected core tables exist.
- [x] Task: Implement Zod Alignment Guard 28889df
  - [x] Create `api/src/db/migrations/alignment.ts`.
  - [x] Implement logic to compare the columns/types returned by a `SELECT * ... LIMIT 0` query with the Zod schema keys for our core entities.
  - [x] Integrate this guard into the post-migration startup sequence.
- [x] Task: Conductor - User Manual Verification 'Integrity & Alignment Guards' (Protocol in workflow.md) 28889df

## Phase 4: Final Verification & Hardening

- [x] Task: Regression Testing 2bf5473
  - [x] Create `api/test/db/migrations.test.ts`.
  - [x] Test bootstrapping from an empty DB.
  - [x] Test that adding a dummy `002` migration works correctly.
  - [x] Test that manual DB drift (renaming a column) causes the Alignment Guard to fail.
- [x] Task: Conductor - User Manual Verification 'Final Verification & Hardening' (Protocol in workflow.md) 2bf5473
