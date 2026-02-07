# Specification: Drizzle Removal (Raw SQL + Zod Transition)

## Overview

This track involves the total removal of Drizzle ORM and Drizzle Kit from the project. It replaces the current query-building layer with raw SQL queries executed via `postgres.js`, with results validated and typed using Zod schemas defined within each respective database module.

## Functional Requirements

1. **Schema Reference:** Before modifying any code, create `conductor/db-schema-reference.md` documenting the current PostgreSQL schema (tables, columns, types, constraints) as defined in the existing Drizzle schema.
2. **Dependencies:** Remove `drizzle-orm` and `drizzle-kit` from `deno.json`.
3. **Database Client:** Refactor `api/src/db/client.ts` to export only the `postgres` client. Remove the `drizzle` instance.
4. **Common Utilities:** Create `api/src/db/common.ts` to house shared Zod schema fragments (e.g., E-Tags, audit timestamps, access counters) and common SQL query helpers.
5. **Entity Refactoring:**
   - For `character.ts`, `corporation.ts`, `alliance.ts`, `auth.ts`, and `system_state.ts`:
     - Define a Zod schema for the entity (static and/or ephemeral), utilizing shared fragments from `db/common.ts`.
     - Export inferred TypeScript types from these schemas.
     - Rewrite all Drizzle queries as Raw SQL.
     - Validate all query results through the Zod schemas before returning.
6. **Discovery Queue:** Refactor `api/src/services/discovery/queue.ts` and `maintenance.ts` to use Raw SQL for queue operations.
7. **Schema Cleanup:** Remove `api/src/db/schema.ts` and associated Drizzle files once the migration is complete.

## Non-Functional Requirements

- **Zero-Trust Integrity:** Every row returned from the database must pass Zod validation.
- **Performance:** Eliminate the abstraction overhead of the ORM.
- **Type Safety:** Maintain strict TypeScript safety using Zod's inference capabilities.

## Acceptance Criteria

- The project contains zero imports from `drizzle-orm`.
- `deno task db:generate` and `db:migrate` tasks are removed or marked as deprecated.
- All existing database and service tests pass using the new Raw SQL implementation.
- Entity resolution (Character/Corp/Alliance) via tRPC remains fully functional.

## Out of Scope

- Automated migration management.
- Database schema construction/initialization logic (to be handled in a future track).
