# Implementation Plan - Foundation Polishing

## Phase 1: Structured Logging

- [x] Task: Implement Logger Utility acb3e51
  - [x] Sub-task: Create `api/src/utils/logger.ts`
- [x] Task: Integrate Logger acb3e51
  - [x] Sub-task: Replace all `console.log/warn/error` in `api/src/`

## Phase 2: Hydration Refactor

- [x] Task: Refactor NPC Hydration acb3e51
  - [x] Sub-task: Update `npc_corps.ts` to use `corporationService.getById`
  - [x] Sub-task: Remove redundant code and imports

## Phase 3: Final Verification

- [~] Task: Verify Integration
  - [ ] Sub-task: Run all tests and verify logging output
  - [ ] Sub-task: Verify `corporation_static` contains E-Tags for NPC corps
