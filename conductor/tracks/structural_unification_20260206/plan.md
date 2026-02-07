# Implementation Plan - Structural Unification

## Phase 1: Foundation & Validation

- [x] Task: Unified Result Helper 7b1e364
  - [x] Sub-task: Implement `api/src/utils/result.ts` with `wrapAsync`
- [x] Task: ESI Schemas 7b1e364
  - [x] Sub-task: Create `api/src/clients/esi_schemas.ts` with Zod definitions for all extraction endpoints

## Phase 2: DB Layer Unification

- [x] Task: Generic Base DB 72bba80
  - [x] Sub-task: Create `api/src/db/base.ts` with generic entity operations
- [x] Task: Refactor Entity DB Modules 72bba80
  - [x] Sub-task: Update `character.ts`, `corporation.ts`, and `alliance.ts` to use base generics
  - [x] Sub-task: Verify all existing tests pass

## Phase 3: Service & Extraction Hardening

- [ ] Task: Validated Extraction
  - [ ] Sub-task: Update `api/src/services/discovery/extraction.ts` to use Zod schemas
- [ ] Task: Unify Service Logic
  - [ ] Sub-task: (Optional/Future) Consider a generic `BaseService` if Phase 2 yields significant patterns

## Phase 4: Final Verification

- [ ] Task: Verification Suite
  - [ ] Sub-task: Run all tests
  - [ ] Sub-task: Run `deno check` and `deno lint`
