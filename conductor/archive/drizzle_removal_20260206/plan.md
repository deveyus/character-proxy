# Implementation Plan: Drizzle Removal (Raw SQL + Zod Transition)

## Phase 1: Foundation & Documentation
- [x] Task: Create Database Schema Reference Document 99c6a34
    - [x] Analyze `api/src/db/schema.ts` and existing migrations
    - [x] Create `conductor/db-schema-reference.md` documenting all tables, columns, and constraints
- [x] Task: Update Tech Stack Documentation 792e7a1
    - [x] Update `conductor/tech-stack.md` to reflect the move from Drizzle to Raw SQL + Zod
- [x] Task: Create Common DB Utilities 736157b
    - [x] Implement `api/src/db/common.ts` with shared Zod schema fragments (Audit timestamps, ETags, Access Counters)
- [x] Task: Refactor DB Client 7c20f6d
    - [x] Modify `api/src/db/client.ts` to expose the raw `sql` client (retaining the `db` Drizzle instance temporarily for compatibility)
- [x] Task: Conductor - User Manual Verification 'Foundation & Documentation' (Protocol in workflow.md) 7c20f6d

## Phase 2: Core Entity Migration
- [x] Task: Migrate Character Module 61d08f2
    - [x] Define Zod schemas and inferred types in `api/src/db/character.ts`
    - [x] Rewrite Character queries to Raw SQL with Zod validation
    - [x] Verify with existing tests in `api/test/db/character.test.ts`
- [x] Task: Migrate Corporation Module 15afe93
    - [x] Define Zod schemas and inferred types in `api/src/db/corporation.ts`
    - [x] Rewrite Corporation queries to Raw SQL with Zod validation
    - [x] Verify with existing tests
- [x] Task: Migrate Alliance Module df7af42
    - [x] Define Zod schemas and inferred types in `api/src/db/alliance.ts`
    - [x] Rewrite Alliance queries to Raw SQL with Zod validation
    - [x] Verify with existing tests
- [x] Task: Conductor - User Manual Verification 'Core Entity Migration' (Protocol in workflow.md) df7af42

## Phase 3: Infrastructure Module Migration
- [x] Task: Migrate Auth Module cfe9395
    - [x] Define Zod schemas in `api/src/services/auth.ts`
    - [x] Rewrite API key queries to Raw SQL with Zod validation
    - [x] Verify with existing tests
- [x] Task: Migrate System State Module 7943b5a
    - [x] Define Zod schema in `api/src/db/system_state.ts`
    - [x] Rewrite System State queries to Raw SQL with Zod validation
- [x] Task: Migrate Discovery Queue & Maintenance b570246
    - [x] Rewrite `api/src/services/discovery/queue.ts` queries to Raw SQL
    - [x] Rewrite `api/src/services/discovery/maintenance.ts` queries to Raw SQL
    - [x] Verify with existing tests in `api/test/services/discovery.test.ts`
- [x] Task: Conductor - User Manual Verification 'Infrastructure Module Migration' (Protocol in workflow.md) b570246

## Phase 4: Drizzle Removal & Cleanup
- [x] Task: Remove Drizzle Imports b570246
    - [x] Audit all files and remove remaining `drizzle-orm` imports
    - [x] Delete `api/src/db/schema.ts` and associations
- [x] Task: Uninstall Dependencies 145250
    - [x] Remove `drizzle-orm` and `drizzle-kit` from `deno.json`
    - [x] Remove database tasks (`db:generate`, `db:migrate`) from `deno.json`
- [x] Task: Final Project Verification 145250
    - [x] Run `deno check` on the entire project
    - [x] Run full test suite `deno test -A`
- [x] Task: Conductor - User Manual Verification 'Drizzle Removal & Cleanup' (Protocol in workflow.md) 145250
