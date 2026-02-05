# Implementation Plan - ESI Proxy & Cache Management

## Phase 1: Persistence Refactor & Schema Update

- [x] Task: Rename and Refactor DB Layer acb3e51
  - [x] Sub-task: Move `api/src/db/repos/entity.repo.ts` to `api/src/db/entity.ts`
  - [x] Sub-task: Update all imports and verify tests pass
- [x] Task: Update Schema with Cache Metadata 187982f
  - [x] Sub-task: Add `etag`, `expiresAt`, `lastModifiedAt` to static tables in `schema.ts`
  - [x] Sub-task: Generate and apply migrations
- [x] Task: Update DB functions to handle new fields 187982f
  - [x] Sub-task: Update `resolveById` and `resolveByName` to include cache fields

## Phase 2: ESI Client Layer

- [x] Task: Implement Functional ESI Client f104c35
  - [x] Sub-task: Create `api/src/clients/esi.ts` with E-Tag support
  - [x] Sub-task: Add unit tests with fixture-based results (avoiding global mocks)

## Phase 3: Intelligent Service Layer (Checkpoint: 96204af)

- [x] Task: Implement Entity Service 782a55a
  - [x] Sub-task: Create `api/src/services/entity.ts` with `getCharacter`, `getCorporation`, `getAlliance`
  - [x] Sub-task: Implement the "Smart Cache" logic (Check DB -> Call ESI -> Update Ledger)
- [x] Task: Integrate with tRPC Router 782a55a
  - [x] Sub-task: Update `router.ts` to call Service functions instead of DB functions directly
- [x] Task: Integration Test for Proxy Logic 782a55a
  - [x] Sub-task: Create `api/test/services/entity.service.test.ts` to verify cache logic
