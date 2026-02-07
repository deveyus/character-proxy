# Implementation Plan - API Key Management

## Phase 1: DB & Logic

- [ ] Task: DB Schema
  - [ ] Sub-task: Create migration for `api_keys` table
  - [ ] Sub-task: Run migration
- [ ] Task: Key Management Service
  - [ ] Sub-task: Implement `api/src/services/auth.ts` (hashKey, createKey, validateKey)

## Phase 2: tRPC Integration

- [ ] Task: Update Middleware
  - [ ] Sub-task: Refactor `protectedProcedure` in `router.ts` to use `authService.validateKey`
  - [ ] Sub-task: Implement in-memory cache for hot keys
- [ ] Task: Management Procedures
  - [ ] Sub-task: Add `registerApiKey` and `revokeApiKey` to `appRouter`

## Phase 3: CLI Tooling

- [ ] Task: CLI Utility
  - [ ] Sub-task: Implement `api/src/manage_keys.ts`
  - [ ] Sub-task: Add `deno task manage:keys` to `deno.json`

## Phase 4: Verification

- [ ] Task: Verify Dynamic Auth
  - [ ] Sub-task: Issue a key via CLI and verify it works for tRPC requests
  - [ ] Sub-task: Revoke the key and verify it immediately fails
