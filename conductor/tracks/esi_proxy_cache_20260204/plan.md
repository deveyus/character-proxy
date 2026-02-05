# Implementation Plan - ESI Proxy & Cache Management

## Phase 1: Persistence Refactor & Schema Update

- [~] Task: Rename and Refactor DB Layer
  - [ ] Sub-task: Move `api/src/db/repos/entity.repo.ts` to `api/src/db/entity.ts`
  - [ ] Sub-task: Update all imports and verify tests pass
- [ ] Task: Update Schema with Cache Metadata
  - [ ] Sub-task: Add `etag`, `expiresAt`, `lastModifiedAt` to static tables in `schema.ts`
  - [ ] Sub-task: Generate and apply migrations
- [ ] Task: Update DB functions to handle new fields
  - [ ] Sub-task: Update `resolveById` and `resolveByName` to include cache fields

## Phase 2: ESI Client Layer

- [ ] Task: Implement Functional ESI Client
  - [ ] Sub-task: Create `api/src/clients/esi.ts` with E-Tag support
  - [ ] Sub-task: Add unit tests with fixture-based results (avoiding global mocks)

## Phase 3: Intelligent Service Layer

- [ ] Task: Implement Entity Service
  - [ ] Sub-task: Create `api/src/services/entity.ts` with `getCharacter`, `getCorporation`, `getAlliance`
  - [ ] Sub-task: Implement the "Smart Cache" logic (Check DB -> Call ESI -> Update Ledger)
- [ ] Task: Integrate with tRPC Router
  - [ ] Sub-task: Update `router.ts` to call Service functions instead of DB functions directly
- [ ] Task: Integration Test for Proxy Logic
  - [ ] Sub-task: Create `api/test/services/entity.service.test.ts` to verify cache logic
