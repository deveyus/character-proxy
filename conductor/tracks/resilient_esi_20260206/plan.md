# Implementation Plan - Resilient ESI

## Phase 1: Health Tracking & Error Classification

- [ ] Task: Enhanced Limiter
  - [ ] Sub-task: Update `api/src/clients/esi_limiter.ts` to track `apiHealth` (up/down/degraded)
- [ ] Task: Error Classification
  - [ ] Sub-task: Update `ESIResponse` type in `esi.ts` to be more descriptive

## Phase 2: Retry Logic Implementation

- [ ] Task: Exponential Backoff Helper
  - [ ] Sub-task: Implement `withRetry` utility in `api/src/clients/esi.ts`
- [ ] Task: Health Check Logic
  - [ ] Sub-task: Implement `checkApiStatus()` in `esi.ts`
- [ ] Task: Update `fetchEntity`
  - [ ] Sub-task: Integrate retries and health checks into the main fetch loop

## Phase 3: Integration & Verification

- [ ] Task: Worker Integration
  - [ ] Sub-task: Ensure `DiscoveryWorker` pauses when API health is 'down'
- [ ] Task: Verification
  - [ ] Sub-task: Write tests mocking 5xx errors and verifying retry attempts
  - [ ] Sub-task: Write tests verifying 404s do NOT retry
