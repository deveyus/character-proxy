# Implementation Plan: Code Quality Polish

## Phase 1: Type Hardening

- [x] Task: Define and export Tx type in client.ts 12e883a
  - [x] Modify `api/src/db/client.ts` to export `type Tx = typeof sql`.
- [x] Task: Update DB modules to use Tx type 6bf6489
  - [x] Update `api/src/db/character.ts` (Remove `any`).
  - [x] Update `api/src/db/corporation.ts` (Remove `any`).
  - [x] Update `api/src/db/alliance.ts` (Remove `any`).
  - [x] Update `api/src/services/auth.ts` (Update `ApiKeySchema` and function signatures).
  - [x] Update `api/src/db/system_state.ts` (Remove `any`).
- [x] Task: Verify Type Integrity 6bf6489
  - [x] Run `deno check api/src/main.ts`.
- [x] Task: Conductor - User Manual Verification 'Type Hardening' (Protocol in workflow.md) 6bf6489

## Phase 2: System Service Extraction

- [x] Task: Create System Service d6b4b56
  - [x] Create `api/src/services/system.ts`.
  - [x] Implement `getSystemStatus` logic (fetching heartbeats and queue depth).
- [x] Task: Refactor tRPC Router ab3c970
  - [x] Update `api/src/trpc/router.ts` to call `systemService.getSystemStatus`.
  - [x] Remove SQL template literals from the router.
- [x] Task: Verify Service Integration ab3c970
  - [x] Run `deno task dev` and verify status via tRPC if possible, or run existing health tests.
- [x] Task: Conductor - User Manual Verification 'System Service Extraction' (Protocol in workflow.md) ab3c970

## Phase 3: Event-Driven Test Synchronization

- [x] Task: Implement Extraction Event Emitter b9a7593
  - [x] Add a simple `EventEmitter` (or custom callback registry) to `api/src/services/discovery/extraction.ts`.
  - [x] Emit an event when `extractFromCharacter`, `extractFromCorporation`, and `extractFromAlliance` finish their async work.
- [x] Task: Refactor Discovery Integration Test 86457e5
  - [x] Modify `api/test/services/discovery.test.ts` to listen for the extraction event.
  - [x] Remove `setTimeout` calls.
- [x] Task: Verify Test Reliability 86457e5
  - [x] Run `deno test -A api/test/services/discovery.test.ts` multiple times to ensure zero flakiness.
- [x] Task: Conductor - User Manual Verification 'Event-Driven Test Synchronization' (Protocol in workflow.md) 86457e5

## Phase 4: Final Polishing

- [x] Task: Final Verification Suite ab3c970
  - [x] Run `deno test -A`.
  - [x] Run `deno lint`.
  - [x] Run `deno fmt`.
- [x] Task: Conductor - User Manual Verification 'Final Polishing' (Protocol in workflow.md) ab3c970
