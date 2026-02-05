# Implementation Plan - Entity Type Separation

## Phase 1: DB Layer Separation

- [x] Task: Create Specialized DB Modules
  - [x] Sub-task: Implement `api/src/db/character.ts`
  - [x] Sub-task: Implement `api/src/db/corporation.ts`
  - [x] Sub-task: Implement `api/src/db/alliance.ts`
- [x] Task: Cleanup and Migration
  - [x] Sub-task: Remove `api/src/db/entity.ts`
  - [x] Sub-task: Update tests in `api/test/db/` to use new modules

## Phase 2: Service Layer Separation

- [~] Task: Create Specialized Service Modules
  - [ ] Sub-task: Implement `api/src/services/character.ts`
  - [ ] Sub-task: Implement `api/src/services/corporation.ts`
  - [ ] Sub-task: Implement `api/src/services/alliance.ts`
- [ ] Task: Cleanup
  - [ ] Sub-task: Remove `api/src/services/entity.ts`
  - [ ] Sub-task: Update tests in `api/test/services/` to use new modules

## Phase 3: Integration & Verification

- [ ] Task: Update tRPC Router
  - [ ] Sub-task: Update `api/src/trpc/router.ts` to use specialized services
- [ ] Task: Final Verification
  - [ ] Sub-task: Run all tests and verify zero `any` casts in modified files
  - [ ] Sub-task: Run `deno lint` and `deno fmt`
