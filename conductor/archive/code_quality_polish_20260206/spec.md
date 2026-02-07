# Specification: Code Quality Polish

## Overview
Polish the existing codebase by resolving technical debt identified during the architectural audit. This includes hardening transaction types, extracting system-level services, and improving integration test reliability.

## Functional Requirements
1.  **Hardened Transaction Typing:**
    -   Define `export type Tx = typeof sql` in `api/src/db/client.ts`.
    -   Update `alliance.ts`, `character.ts`, `corporation.ts`, `auth.ts`, and `system_state.ts` to use this exported `Tx` type instead of `any`.
2.  **System Service Extraction:**
    -   Create `api/src/services/system.ts`.
    -   Move the SQL logic for heartbeats and discovery queue depth from `api/src/trpc/router.ts` into this service.
    -   Update the tRPC router to call the new service.
3.  **Event-Driven Test Synchronization:**
    -   Implement an internal event emitter (or simple callback registry) in `api/src/services/discovery/extraction.ts`.
    -   Emit an event when an extraction process completes.
    -   Refactor `api/test/services/discovery.test.ts` to await this event instead of using `setTimeout`.

## Non-Functional Requirements
-   **Type Safety:** Eliminate the remaining `any` casts in the database layer.
-   **Separation of Concerns:** Ensure the tRPC router remains focused on request/response mapping rather than data retrieval.
-   **Test Determinism:** Ensure integration tests are fast and reliable by removing arbitrary sleep periods.

## Acceptance Criteria
-   The codebase contains no `Tx = any` declarations.
-   `api/src/trpc/router.ts` contains zero SQL template literals.
-   `deno test -A api/test/services/discovery.test.ts` passes consistently without `setTimeout`.

## Out of Scope
-   Major database schema changes.
-   Changes to ESI client logic.
