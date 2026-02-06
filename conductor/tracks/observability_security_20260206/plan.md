# Implementation Plan - Observability & Security

## Phase 1: Security & Context

- [x] Task: API Key Authentication 7b7f208
  - [x] Sub-task: Update `api/src/trpc/context.ts` to check `x-api-key` header
  - [x] Sub-task: Update `api/src/trpc/router.ts` to enforce auth on sensitive procedures

## Phase 2: Metrics & Heartbeats

- [~] Task: Metrics Collector
  - [ ] Sub-task: Implement `api/src/utils/metrics.ts`
- [ ] Task: Worker Heartbeat
  - [ ] Sub-task: Update `api/src/services/discovery/worker.ts` to send heartbeats
- [ ] Task: System Status Procedure
  - [ ] Sub-task: Implement `getSystemStatus` in `router.ts`

## Phase 3: Enhanced Logging & Integration

- [ ] Task: Log Refinement
  - [ ] Sub-task: Audit and update logs in `esi.ts`, `worker.ts`, and `maintenance.ts`
- [ ] Task: Metrics Integration
  - [ ] Sub-task: Add metric increments to relevant services

## Phase 4: Verification

- [ ] Task: Verify Auth
  - [ ] Sub-task: Test that requests without a valid API key fail
- [ ] Task: Verify Observability
  - [ ] Sub-task: Check metrics output after running discovery for a few minutes
