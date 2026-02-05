# Implementation Plan - Foundation Polishing

## Phase 1: Structured Logging

- [x] Task: Implement Logger Utility 7714c57
  - [x] Sub-task: Create `api/src/utils/logger.ts`
- [x] Task: Refactor to std/log (OTel Ready) 31782d5
  - [x] Sub-task: Update `logger.ts` to use `std/log` with JSON/Pretty formats
- [x] Task: Integrate Logger 31782d5
  - [x] Sub-task: Replace all `console.log/warn/error` in `api/src/` (Updated)

## Phase 2: Hydration Refactor

- [x] Task: Refactor NPC Hydration 7714c57
  - [x] Sub-task: Update `npc_corps.ts` to use `corporationService.getById`
  - [x] Sub-task: Remove redundant code and imports

## Phase 3: Final Verification

- [x] Task: Verify Integration 7714c57
  - [x] Sub-task: Run all tests and verify logging output
  - [x] Sub-task: Verify `corporation_static` contains E-Tags for NPC corps
