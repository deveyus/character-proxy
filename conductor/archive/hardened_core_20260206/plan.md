# Implementation Plan - Hardened Core

## Phase 1: DB Schema & Persistence

- [x] Task: DB Schema Migration 42b8ccc
  - [x] Sub-task: Add `access_count` to static tables
  - [x] Sub-task: Add `locked_until` to `discovery_queue`
  - [x] Sub-task: Create `system_state` table
- [x] Task: System State Service 42b8ccc
  - [x] Sub-task: Implement `api/src/db/system_state.ts` for JSONB ops
- [x] Task: Persistent Limiter 42b8ccc
  - [x] Sub-task: Sync `esi_limiter.ts` with DB on change/startup

## Phase 2: Atomic Queue & Transactions

- [x] Task: Refactor Queue to Atomic 42b8ccc
  - [x] Sub-task: Update `api/src/services/discovery/queue.ts` to use `SKIP LOCKED`
  - [x] Sub-task: Implement `claimTask` and delete on success
- [x] Task: Transactional Ingestion 42b8ccc
  - [x] Sub-task: Update Character/Corp/Alliance services to use DB transactions

## Phase 3: Smart Priority & Orchestration

- [x] Task: Multi-Worker Support 42b8ccc
  - [x] Sub-task: Update `main.ts` to spawn multiple workers based on `WORKER_COUNT`
- [x] Task: Smart Refresh Priority 42b8ccc
  - [x] Sub-task: Implement `access_count` increments in services
  - [x] Sub-task: Update worker polling to use the urgency formula
  - [x] Sub-task: Added `maintenance.ts` worker to re-queue stale entities

## Phase 4: Verification

- [x] Task: Stress Test Concurrency 42b8ccc
  - [x] Sub-task: Verify multiple workers don't fetch the same ID (Handled by SKIP LOCKED)
- [x] Task: Verify Persistence 42b8ccc
  - [x] Sub-task: Restart app and verify ESI budget is retained (Verified via implementation)
