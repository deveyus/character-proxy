# Implementation Plan: Drizzle Removal (Raw SQL + Zod Transition)

## Phase 1: Foundation & Documentation
- [x] Task: Create Database Schema Reference Document 99c6a34
    - [x] Analyze `api/src/db/schema.ts` and existing migrations
    - [x] Create `conductor/db-schema-reference.md` documenting all tables, columns, and constraints
- [ ] Task: Update Tech Stack Documentation
    - [ ] Update `conductor/tech-stack.md` to reflect the move from Drizzle to Raw SQL + Zod
- [ ] Task: Create Common DB Utilities
    - [ ] Implement `api/src/db/common.ts` with shared Zod schema fragments (Audit timestamps, ETags, Access Counters)
- [ ] Task: Refactor DB Client
    - [ ] Modify `api/src/db/client.ts` to expose the raw `sql` client (retaining the `db` Drizzle instance temporarily for compatibility)
- [ ] Task: Conductor - User Manual Verification 'Foundation & Documentation' (Protocol in workflow.md)

## Phase 2: Core Entity Migration
- [ ] Task: Migrate Character Module
    - [ ] Define Zod schemas and inferred types in `api/src/db/character.ts`
    - [ ] Rewrite Character queries to Raw SQL with Zod validation
    - [ ] Verify with existing tests in `api/test/db/character.test.ts`
- [ ] Task: Migrate Corporation Module
    - [ ] Define Zod schemas and inferred types in `api/src/db/corporation.ts`
    - [ ] Rewrite Corporation queries to Raw SQL with Zod validation
    - [ ] Verify with existing tests
- [ ] Task: Migrate Alliance Module
    - [ ] Define Zod schemas and inferred types in `api/src/db/alliance.ts`
    - [ ] Rewrite Alliance queries to Raw SQL with Zod validation
    - [ ] Verify with existing tests
- [ ] Task: Conductor - User Manual Verification 'Core Entity Migration' (Protocol in workflow.md)

## Phase 3: Infrastructure Module Migration
- [ ] Task: Migrate Auth Module
    - [ ] Define Zod schemas in `api/src/services/auth.ts`
    - [ ] Rewrite API key queries to Raw SQL with Zod validation
    - [ ] Verify with existing tests
- [ ] Task: Migrate System State Module
    - [ ] Define Zod schema in `api/src/db/system_state.ts`
    - [ ] Rewrite System State queries to Raw SQL with Zod validation
- [ ] Task: Migrate Discovery Queue & Maintenance
    - [ ] Rewrite `api/src/services/discovery/queue.ts` queries to Raw SQL
    - [ ] Rewrite `api/src/services/discovery/maintenance.ts` queries to Raw SQL
    - [ ] Verify with existing tests in `api/test/services/discovery.test.ts`
- [ ] Task: Conductor - User Manual Verification 'Infrastructure Module Migration' (Protocol in workflow.md)

## Phase 4: Drizzle Removal & Cleanup
- [ ] Task: Remove Drizzle Imports
    - [ ] Audit all files and remove remaining `drizzle-orm` imports
    - [ ] Delete `api/src/db/schema.ts` and associations
- [ ] Task: Uninstall Dependencies
    - [ ] Remove `drizzle-orm` and `drizzle-kit` from `deno.json`
    - [ ] Remove database tasks (`db:generate`, `db:migrate`) from `deno.json`
- [ ] Task: Final Project Verification
    - [ ] Run `deno check` on the entire project
    - [ ] Run full test suite `deno test -A`
- [ ] Task: Conductor - User Manual Verification 'Drizzle Removal & Cleanup' (Protocol in workflow.md)
