# Implementation Plan - Observability & Security

## Phase 1: Security & Context

- [x] Task: API Key Authentication 7b7f208
  - [x] Sub-task: Update `api/src/trpc/context.ts` to check `x-api-key` header
  - [x] Sub-task: Update `api/src/trpc/router.ts` to enforce auth on sensitive procedures

## Phase 2: Metrics & Heartbeats

- [x] Task: Metrics Collector d46d68e
  - [x] Sub-task: Implement `api/src/utils/metrics.ts`
- [x] Task: Worker Heartbeat d46d68e
  - [x] Sub-task: Update `api/src/services/discovery/worker.ts` to send heartbeats
- [x] Task: System Status Procedure d46d68e
  - [x] Sub-task: Implement `getSystemStatus` in `router.ts`

## Phase 3: Enhanced Logging & Integration

- [x] Task: Log Refinement d46d68e
  - [x] Sub-task: Audit and update logs in `esi.ts`, `worker.ts`, and `maintenance.ts`
- [x] Task: Metrics Integration d46d68e
  - [x] Sub-task: Add metric increments to relevant services

## Phase 4: Verification

- [x] Task: Verify Auth d46d68e
  - [x] Sub-task: Test that requests without a valid API key fail
- [x] Task: Verify Observability d46d68e
  - [x] Sub-task: Check metrics output after running discovery for a few minutes
