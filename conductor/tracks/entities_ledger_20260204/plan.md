# Implementation Plan - Core Entity Schema

## Phase 1: Entity & Ledger Schema

- [x] Task: Define Core Entity Tables (Static & Ephemeral) 3e6da4d
  - [x] Sub-task: Implement `character_static` and `character_ephemeral`
  - [x] Sub-task: Implement `corporation_static` and `corporation_ephemeral`
  - [x] Sub-task: Implement `alliance_static` and `alliance_ephemeral`
- [x] Task: Generate and Apply Migrations 3e6da4d
  - [x] Sub-task: Run `deno task db:generate`
  - [x] Sub-task: Verify `deno task dev` applies migrations successfully
- [ ] Task: Conductor - User Manual Verification 'Entity Schema'

## Phase 2: Local Resolution Service

- [ ] Task: Implement Local Repository Logic
  - [ ] Sub-task: Create `api/src/db/repos/entity.repo.ts` with Result-based lookups
- [ ] Task: Add tRPC Procedures
  - [ ] Sub-task: Add `resolveById` and `resolveByName` to `appRouter`
- [ ] Task: Write Integration Tests
  - [ ] Sub-task: Create `api/test/repos/entity.repo.test.ts`
- [ ] Task: Conductor - User Manual Verification 'Local Resolution'