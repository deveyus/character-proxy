# Implementation Plan: Resilient Discovery Safeguards

## Phase 1: ESI Limiter Hardening
- [x] Task: Coordinate Global Error Limits bd046ae
    - [x] Update `api/src/clients/esi_limiter.ts` to add `refreshLimiterState()`, which re-pulls state from the DB.
    - [x] Modify `esi.ts` (`fetchOnce`) to call `refreshLimiterState()` for all `background` priority requests.
- [x] Task: Unify ESI Client usage 070f8c6
    - [x] Refactor `api/src/services/discovery/prober.ts` to use `fetchEntity` from `esi.ts` for bulk probes.
    - [x] Correctly parse the `category` from ESI and use it in the `addToQueue` call.
- [ ] Task: Conductor - User Manual Verification 'ESI Limiter Hardening' (Protocol in workflow.md)

## Phase 2: Reactive Discovery Engine
- [x] Task: Implement Queue Event Signaling aeb09e4
    - [x] Add `queue_updated` event to `DiscoveryEvent` type in `api/src/services/discovery/extraction.ts`.
    - [x] Update `addToQueue` in `queue.ts` to emit the `queue_updated` event on successful insert.
- [x] Task: Refactor Worker to Event-Driven aeb09e4
    - [x] Update `api/src/services/discovery/worker.ts` to remove `setTimeout` sleeps.
    - [x] Implement a `wait` mechanism using a Promise + `onDiscoveryEvent('queue_updated')` when the queue is empty.
- [ ] Task: Conductor - User Manual Verification 'Reactive Discovery Engine' (Protocol in workflow.md)

## Phase 3: Final Verification
- [x] Task: Multi-Worker Simulation 236989
    - [x] Create a script `test_limiter_sync.ts` that spawns 5 concurrent fetchers.
    - [x] Verify that as soon as the budget hits the threshold, all 5 fetchers pause simultaneously.
- [x] Task: Project audit 237068
    - [x] Run `deno check`.
    - [x] Run `deno lint`.
- [x] Task: Conductor - User Manual Verification 'Final Verification' (Protocol in workflow.md) cc0c777
