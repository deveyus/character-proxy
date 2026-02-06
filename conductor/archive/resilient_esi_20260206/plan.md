# Implementation Plan - Resilient ESI

## Phase 1: Health Tracking & Error Classification

- [x] Task: Enhanced Limiter 9b42b3b
  - [x] Sub-task: Update `api/src/clients/esi_limiter.ts` to track `apiHealth` (up/down/degraded)
- [x] Task: Error Classification 9b42b3b
  - [x] Sub-task: Update `ESIResponse` type in `esi.ts` to be more descriptive

## Phase 2: Retry Logic Implementation

- [x] Task: Exponential Backoff Helper a78f41f
  - [x] Sub-task: Implement `withRetry` utility in `api/src/clients/esi.ts`
- [x] Task: Health Check Logic a78f41f
  - [x] Sub-task: Implement `checkApiStatus()` in `esi.ts`
- [x] Task: Update `fetchEntity` a78f41f
  - [x] Sub-task: Integrate retries and health checks into the main fetch loop

## Phase 3: Integration & Verification

- [x] Task: Worker Integration 9b9cbd0
  - [x] Sub-task: Ensure `DiscoveryWorker` pauses when API health is 'down'
- [x] Task: Verification a78f41f
  - [x] Sub-task: Verify that core tests pass with the new retry logic. (Manual/Log verification of retries confirmed during implementation)
  - [x] Sub-task: Verify error classification through service integration.
