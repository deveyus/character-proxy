# Implementation Plan - Resilient Freshness & Rate Management

## Phase 1: Rate Limiter & ESI Integration

- [x] Task: Implement Rate Limit Tracker
  - [x] Sub-task: Create `api/src/clients/esi_limiter.ts`
- [x] Task: Update ESI Client
  - [x] Sub-task: Update `api/src/clients/esi.ts` to report header values to the limiter

## Phase 2: Service Layer Refactor

- [x] Task: Centralize TTL & Fallback Logic
  - [x] Sub-task: Create a helper in `api/src/services/utils.ts` to handle the "Should I fetch?" and Fallback logic
- [x] Task: Update Entity Services
  - [x] Sub-task: Update Character, Corporation, and Alliance services to use the new TTL helper and accept `maxAge`

## Phase 3: tRPC & Metadata

- [~] Task: Update tRPC Schemas
  - [ ] Sub-task: Add `maxAge` to Zod inputs
  - [ ] Sub-task: Implement the enriched response wrapper in `router.ts`
- [ ] Task: Verification
  - [ ] Sub-task: Write integration tests verifying `maxAge` behavior and rate-limit fallbacks
