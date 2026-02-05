# Implementation Plan - Entity Type Separation

## Phase 1: DB Layer Separation

- [x] Task: Create Specialized DB Modules c33136a
  - [x] Sub-task: Implement `api/src/db/character.ts`
  - [x] Sub-task: Implement `api/src/db/corporation.ts`
  - [x] Sub-task: Implement `api/src/db/alliance.ts`
- [x] Task: Cleanup and Migration c33136a
  - [x] Sub-task: Remove `api/src/db/entity.ts`
  - [x] Sub-task: Update tests in `api/test/db/` to use new modules

## Phase 2: Service Layer Separation

- [x] Task: Create Specialized Service Modules c33136a
  - [x] Sub-task: Implement `api/src/services/character.ts`
  - [x] Sub-task: Implement `api/src/services/corporation.ts`
  - [x] Sub-task: Implement `api/src/services/alliance.ts`
- [x] Task: Cleanup c33136a
  - [x] Sub-task: Remove `api/src/services/entity.ts`
  - [x] Sub-task: Update tests in `api/test/services/` to use new modules

## Phase 3: Integration & Verification

- [x] Task: Update tRPC Router c33136a
  - [x] Sub-task: Update `api/src/trpc/router.ts` to use specialized services
- [x] Task: Final Verification c33136a
  - [x] Sub-task: Run all tests and verify zero `any` casts in modified files
  - [x] Sub-task: Run `deno lint` and `deno fmt`
