# Implementation Plan - Infra Polishing

## Phase 1: DB Schema & Resource Config

- [ ] Task: Schema Migration
  - [ ] Sub-task: Add `last_discovery_at` to static tables
  - [ ] Sub-task: Add index on `last_discovery_at`
- [ ] Task: Connection Pool
  - [ ] Sub-task: Update `client.ts` to support dynamic pool size via `WORKER_COUNT`

## Phase 2: Worker Logic Hardening

- [ ] Task: Refactor Worker Processing
  - [ ] Sub-task: Implement `not_found` immediate deletion
  - [ ] Sub-task: Implement `MAX_ATTEMPTS` check
  - [ ] Sub-task: Handle transient errors without penalty
- [ ] Task: Update Extraction
  - [ ] Sub-task: Update `last_discovery_at` when extraction completes successfully

## Phase 3: Maintenance Worker Optimization

- [ ] Task: Optimize Maintenance Query
  - [ ] Sub-task: Refactor `requeueStaleEntities` to use the new timestamp and more efficient joins

## Phase 4: Verification

- [ ] Task: Verify Stability
  - [ ] Sub-task: Run stress test with multiple workers and simulated errors
- [ ] Task: Performance Check
  - [ ] Sub-task: Verify maintenance query execution time remains low with large datasets (simulated)
