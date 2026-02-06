# Implementation Plan - Hardened Core

## Phase 1: DB Schema & Persistence

- [~] Task: DB Schema Migration
  - [ ] Sub-task: Add `access_count` to static tables
  - [ ] Sub-task: Add `locked_until` to `discovery_queue`
  - [ ] Sub-task: Create `system_state` table
- [ ] Task: System State Service
  - [ ] Sub-task: Implement `api/src/db/system_state.ts` for JSONB ops
- [ ] Task: Persistent Limiter
  - [ ] Sub-task: Sync `esi_limiter.ts` with DB on change/startup

## Phase 2: Atomic Queue & Transactions

- [ ] Task: Refactor Queue to Atomic
  - [ ] Sub-task: Update `api/src/services/discovery/queue.ts` to use `SKIP LOCKED`
  - [ ] Sub-task: Implement `claimTask` and delete on success
- [ ] Task: Transactional Ingestion
  - [ ] Sub-task: Update Character/Corp/Alliance services to use DB transactions

## Phase 3: Smart Priority & Orchestration

- [ ] Task: Multi-Worker Support
  - [ ] Sub-task: Update `main.ts` to spawn multiple workers based on `WORKER_COUNT`
- [ ] Task: Smart Refresh Priority
  - [ ] Sub-task: Implement `access_count` increments in services
  - [ ] Sub-task: Update worker polling to use the urgency formula

## Phase 4: Verification

- [ ] Task: Stress Test Concurrency
  - [ ] Sub-task: Verify multiple workers don't fetch the same ID
- [ ] Task: Verify Persistence
  - [ ] Sub-task: Restart app and verify ESI budget is retained
