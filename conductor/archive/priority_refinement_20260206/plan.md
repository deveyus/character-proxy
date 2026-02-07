# Implementation Plan: Priority Intelligence Refinement

## Phase 1: Core Priority Update

- [x] Task: Update Queue Claiming Logic 8c84bca
  - [x] Refactor the Raw SQL query in `api/src/services/discovery/queue.ts` (`claimTask`).
  - [x] Replace the linear formula with: `POWER(EXTRACT(EPOCH FROM (${now} - COALESCE(char.last_modified_at, corp.last_modified_at, alli.last_modified_at, q.created_at))) / 86400, 2) * LOG(COALESCE(char.access_count, corp.access_count, alli.access_count, 0) + 10)`.
- [x] Task: Update Maintenance Admission Logic 9a96b3c
  - [x] Refactor the re-queuing queries in `api/src/services/discovery/maintenance.ts` (`requeueStaleEntities`).
  - [x] Apply the new formula and set the threshold to `0.125`.

## Phase 2: Verification

- [x] Task: Verify Calculation Stability 178886
  - [x] Create a temporary script `test_priority.ts` to execute the new SQL logic against existing data and print the resulting urgency scores.
  - [x] Ensure no math errors (e.g., division by zero or log of zero) are possible.
- [x] Task: Integration Test Run 179023
  - [x] Run `deno test -A api/test/services/discovery.test.ts` to ensure core discovery remains functional.

## Phase 3: Final Polishing

- [x] Task: Final Project Verification 179145
  - [x] Run `deno test -A`.
  - [x] Run `deno lint`.
