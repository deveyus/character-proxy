# Implementation Plan - Code Quality: Guard Clauses

## Phase 1: Service Layer Refactoring

- [x] Task: Refactor Character Service 29463f1
  - [x] Sub-task: Update `api/src/services/character.ts` to use early returns for ESI response handling
- [x] Task: Refactor Corporation Service 29463f1
  - [x] Sub-task: Update `api/src/services/corporation.ts` to use early returns
- [x] Task: Refactor Alliance Service 29463f1
  - [x] Sub-task: Update `api/src/services/alliance.ts` to use early returns

## Phase 2: tRPC & Worker Refactoring

- [x] Task: Refactor tRPC Router 29463f1
  - [x] Sub-task: Update `api/src/trpc/router.ts` to flatten request dispatching
- [x] Task: Refactor Discovery Worker 29463f1
  - [x] Sub-task: Update `api/src/services/discovery/worker.ts` to simplify loops and conditionals

## Phase 3: Verification

- [x] Task: Run Verification Suite 29463f1
  - [x] Sub-task: Run all tests
  - [x] Sub-task: Run `deno lint` and `deno fmt`
