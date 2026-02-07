# Implementation Plan - Structural Unification

## Phase 1: Foundation & Validation

- [ ] Task: Unified Result Helper
  - [ ] Sub-task: Implement `api/src/utils/result.ts` with `wrapAsync`
- [ ] Task: ESI Schemas
  - [ ] Sub-task: Create `api/src/clients/esi_schemas.ts` with Zod definitions for all extraction endpoints

## Phase 2: DB Layer Unification

- [ ] Task: Generic Base DB
  - [ ] Sub-task: Create `api/src/db/base.ts` with generic entity operations
- [ ] Task: Refactor Entity DB Modules
  - [ ] Sub-task: Update `character.ts`, `corporation.ts`, and `alliance.ts` to use base generics
  - [ ] Sub-task: Verify all existing tests pass

## Phase 3: Service & Extraction Hardening

- [ ] Task: Validated Extraction
  - [ ] Sub-task: Update `api/src/services/discovery/extraction.ts` to use Zod schemas
- [ ] Task: Unify Service Logic
  - [ ] Sub-task: (Optional/Future) Consider a generic `BaseService` if Phase 2 yields significant patterns

## Phase 4: Final Verification

- [ ] Task: Verification Suite
  - [ ] Sub-task: Run all tests
  - [ ] Sub-task: Run `deno check` and `deno lint`
