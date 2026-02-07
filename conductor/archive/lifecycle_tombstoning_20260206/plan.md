# Implementation Plan: Entity Lifecycle & Tombstoning

## Phase 1: Schema & DB
- [x] Task: Update Grand Baseline 210436
    - [x] Add `terminated_at` to `character_static`, `corporation_static`, and `alliance_static` in `001_grand_baseline.ts`.
- [x] Task: Update DB Schemas & Types 210436
    - [x] Update Zod and Raw SQL in `api/src/db/character.ts`, `corporation.ts`, and `alliance.ts`.

## Phase 2: Service Logic
- [x] Task: Character Tombstoning Logic 210436
    - [x] Refactor `api/src/services/character.ts` to handle 404s for known characters.
- [x] Task: Corporation/Alliance Termination Logic 210436
    - [x] Update `api/src/services/corporation.ts` and `api/src/services/alliance.ts`.

## Phase 3: Verification
- [x] Task: Regression Testing 210436
    - [x] Add tests for tombstoning.
