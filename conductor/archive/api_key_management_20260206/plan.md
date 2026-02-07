# Implementation Plan - API Key Management

## Phase 1: DB & Logic

- [x] Task: DB Schema 7b7f208
  - [x] Sub-task: Create migration for `api_keys` table
  - [x] Sub-task: Run migration
- [x] Task: Key Management Service 7b7f208
  - [x] Sub-task: Implement `api/src/services/auth.ts` (SHA3-512 hashing, SHAKE256 generation)

## Phase 2: tRPC Integration

- [x] Task: Update Middleware 7b7f208
  - [x] Sub-task: Refactor `protectedProcedure` in `router.ts` to use `authService.validateKey`
  - [x] Sub-task: Implement in-memory cache for hot keys
- [x] Task: Management Procedures 7b7f208
  - [x] Sub-task: Add `registerApiKey` and `revokeApiKey` to `appRouter` (Admin only)

## Phase 3: CLI Tooling

- [x] Task: CLI Utility 7b7f208
  - [x] Sub-task: Implement `api/src/manage_keys.ts`
  - [x] Sub-task: Add `deno task manage:keys` to `deno.json`

## Phase 4: Verification

- [x] Task: Verify Dynamic Auth 7b7f208
  - [x] Sub-task: Issue a key via CLI and verify it works for tRPC requests
  - [x] Sub-task: Revoke the key and verify it immediately fails (Handled by service logic and tests)
