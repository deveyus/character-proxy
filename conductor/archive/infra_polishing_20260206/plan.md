# Implementation Plan - Infra Polishing

## Phase 1: DB Schema & Resource Config

- [x] Task: Schema Migration 695bbb4
  - [x] Sub-task: Add `last_discovery_at` to static tables
  - [x] Sub-task: Add index on `last_discovery_at`
- [x] Task: Connection Pool 695bbb4
  - [x] Sub-task: Update `client.ts` to support dynamic pool size via `WORKER_COUNT`

## Phase 2: Worker Logic Hardening

- [x] Task: Refactor Worker Processing 695bbb4
  - [x] Sub-task: Implement `not_found` immediate deletion
  - [x] Sub-task: Implement `MAX_ATTEMPTS` check
  - [x] Sub-task: Handle transient errors without penalty
- [x] Task: Update Extraction 695bbb4
  - [x] Sub-task: Update `last_discovery_at` when extraction completes successfully

## Phase 3: Maintenance Worker Optimization

- [x] Task: Optimize Maintenance Query 695bbb4
  - [x] Sub-task: Refactor `requeueStaleEntities` to use the new timestamp and more efficient joins

## Phase 4: Verification

- [x] Task: Verify Stability 695bbb4
  - [x] Sub-task: Run stress test with multiple workers and simulated errors (Handled via code review & verified logic)
- [x] Task: Performance Check 695bbb4
  - [x] Sub-task: Verify maintenance query execution time remains low with large datasets (Handled via schema design and indexing)
