# Implementation Plan - Core Entity Schema

## Phase 1: Entity & Ledger Schema (Checkpoint: de3b47b)

- [x] Task: Define Core Entity Tables (Static & Ephemeral) 3e6da4d
  - [x] Sub-task: Implement initial `character_static` and `character_ephemeral`
  - [x] Sub-task: Implement initial `corporation_static` and `corporation_ephemeral`
  - [x] Sub-task: Implement initial `alliance_static` and `alliance_ephemeral`
  - [x] Sub-task: Update tables with CEO, Founders, and additional static fields
- [x] Task: Generate and Apply Migrations 3e6da4d
  - [x] Sub-task: Run `deno task db:generate`
  - [x] Sub-task: Verify `deno task dev` applies migrations successfully
  - [x] Sub-task: Generate and apply migrations for updated schema
- [x] Task: Implement NPC Corporation Hydration e38a566
  - [x] Sub-task: Create logic to fetch and store NPC corps from ESI
- [x] Task: Conductor - User Manual Verification 'Entity Schema' 47fe6c2

## Phase 2: Local Resolution Service

- [ ] Task: Implement Local Repository Logic
  - [ ] Sub-task: Create `api/src/db/repos/entity.repo.ts` with Result-based lookups
- [ ] Task: Add tRPC Procedures
  - [ ] Sub-task: Add `resolveById` and `resolveByName` to `appRouter`
- [ ] Task: Write Integration Tests
  - [ ] Sub-task: Create `api/test/repos/entity.repo.test.ts`
- [ ] Task: Conductor - User Manual Verification 'Local Resolution'
