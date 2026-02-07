# Implementation Plan: Gap Discovery & Backfill

## Phase 1: Gap Detection Logic
- [x] Task: Implement SQL Gap Finder f894443
    - [x] Create `api/src/db/utils.ts` with a function to find gaps using `LEAD()`.
    - [x] Implement `findEntityGaps(type: 'character' | 'corporation')` returning `Array<{ start: number, end: number, size: number }>`.
- [x] Task: Implement Frontier Scanner 496b74d
    - [x] Add binary search logic to find the High Water Mark (HWM) for characters and corps.
    - [x] Persist HWM in `system_state`.

## Phase 2: Probing Service
- [x] Task: Implement Prober Loop f43d30b
    - [x] Create `api/src/services/discovery/prober.ts`.
    - [x] Implement `runProberStep`: Check queue -> get target IDs -> bulk probe `/universe/names/` -> queue valid -> update state.
- [x] Task: Update Maintenance Threshold e53c401
    - [x] Refactor `api/src/services/discovery/maintenance.ts` to use a threshold of `1.0`.
- [x] Task: Integrate Prober into Main a88b504
    - [x] Start the prober loop in `api/src/main.ts`.

## Phase 3: Final Verification
- [x] Task: Regression Testing 76cff3b
    - [x] Add tests to verify gap detection accuracy.
    - [x] Add integration test for the probing cycle.
- [x] Task: Project Audit ed52182
    - [x] Run `deno check`.
    - [x] Run `deno lint`.
