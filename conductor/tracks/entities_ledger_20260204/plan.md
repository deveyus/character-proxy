# Implementation Plan - Core Entity Schema

## Phase 1: Entity & Ledger Schema

- [~] Task: Define Core Entity Tables (Static & Ephemeral)
    - [ ] Sub-task: Implement `character_static` and `character_ephemeral`
    - [ ] Sub-task: Implement `corporation_static` and `corporation_ephemeral`
    - [ ] Sub-task: Implement `alliance_static` and `alliance_ephemeral`
- [ ] Task: Generate and Apply Migrations
    - [ ] Sub-task: Run `deno task db:generate`
    - [ ] Sub-task: Verify `deno task dev` applies migrations successfully
- [ ] Task: Conductor - User Manual Verification 'Entity Schema'

## Phase 2: Local Resolution Service

- [ ] Task: Implement Local Repository Logic
    - [ ] Sub-task: Create `api/src/db/repos/entity.repo.ts` with Result-based lookups
- [ ] Task: Add tRPC Procedures
    - [ ] Sub-task: Add `resolveById` and `resolveByName` to `appRouter`
- [ ] Task: Write Integration Tests
    - [ ] Sub-task: Create `api/test/repos/entity.repo.test.ts`
- [ ] Task: Conductor - User Manual Verification 'Local Resolution'
