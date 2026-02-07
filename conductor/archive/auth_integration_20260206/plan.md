# Implementation Plan - Auth Integration & Verification

## Phase 1: Core Integration

- [x] Task: DB Schema Integration 2f86a02
  - [x] Sub-task: Verify `api_keys` table definition in `api/src/db/schema.ts`
- [x] Task: Router Security 2f86a02
  - [x] Sub-task: Finalize `protectedProcedure` with dynamic key validation
  - [x] Sub-task: Implement `adminProcedure` with `MASTER_KEY` check
  - [x] Sub-task: Expose key management endpoints
- [x] Task: Test Suite Updates 2f86a02
  - [x] Sub-task: Update `api/test/trpc/entity.test.ts` to use dynamic keys

## Phase 2: Verification

- [x] Task: Test Execution 2f86a02
  - [x] Sub-task: Run full test suite
- [x] Task: Static Analysis 2f86a02
  - [x] Sub-task: Run `deno lint` and `deno check`
