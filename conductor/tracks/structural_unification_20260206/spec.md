# Specification: Structural Unification & Validation

## Goal

Refactor the data and service layers to eliminate code duplication through generic patterns, enforce strict external data validation using Zod, and unify error handling across the application.

## Requirements

### 1. Generic Persistence Layer

- **Unification:** Create `api/src/db/base.ts` containing generic functions for:
  - `resolveById`: Joins static and latest ephemeral.
  - `upsertStatic`: Standard transactional upsert.
  - `appendEphemeral`: Standard transactional append.
- **Typing:** Use Drizzle's `$inferSelect` and `$inferInsert` with generics to maintain full type safety for Character, Corporation, and Alliance types.

### 2. Validated ESI Data (Zod)

- **Schemas:** Define Zod schemas for all ESI responses used in extraction (`api/src/clients/esi_schemas.ts`):
  - Character Response
  - Corporation Response
  - Alliance Response
  - History Arrays
- **Enforcement:** The `extractFrom...` functions must parse data through these schemas. Invalid data should be logged and skipped, not allowed to throw.

### 3. Unified Error Handling

- **Helper:** Implement a `wrapAsync` or `toResult` utility in `api/src/utils/result.ts` to handle the repetitive `try/catch` wrapping of `ts-results-es`.
- **Refactor:** Apply this helper to all service and database methods to reduce boilerplate.

### 4. Consistent Transaction Pattern

- **Explicit Context:** Ensure that functions requiring a transaction context are clearly marked and that the service layer is the sole orchestrator of the transaction lifecycle.

## Standards

- **DRY:** Eliminate identical logic across entity-specific files.
- **Zero-Trust:** Every external byte from ESI must pass a Zod check.
- **Functional Style:** Maintain exported functions over classes where possible.
