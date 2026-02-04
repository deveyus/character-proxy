# Implementation Plan - Core Infrastructure

## Phase 1: Project Configuration

- [x] Task: Initialize `deno.json` with import maps and task definitions f475446

    - [x] Sub-task: Create `deno.json` with strict typescript config

    - [x] Sub-task: Define tasks for `dev`, `test`, `lint`, `fmt`
- [ ] Task: Verify and Update `flake.nix` for PostgreSQL support
  - [ ] Sub-task: Ensure `postgresql` is in `buildInputs`
  - [ ] Sub-task: Add shell hook to initialize/start a local postgres DB for dev if missing
- [ ] Task: Conductor - User Manual Verification 'Project Configuration' (Protocol in workflow.md)

## Phase 2: Database Setup (Drizzle & Postgres)

- [ ] Task: Install Drizzle ORM and Drivers
  - [ ] Sub-task: Add `drizzle-orm` and `postgres` (or `postgres.js`) dependencies to `deno.json` imports
  - [ ] Sub-task: Add `drizzle-kit` as a dev dependency
- [ ] Task: Configure Drizzle and Database Connection
  - [ ] Sub-task: Write Tests: Create `api/test/db/connection.test.ts` expecting a successful DB ping
  - [ ] Sub-task: Implement `api/src/db/client.ts` (Connection logic)
  - [ ] Sub-task: Verify Tests Pass
- [ ] Task: Create Initial Migration Infrastructure
  - [ ] Sub-task: Create a placeholder schema file `api/src/db/schema.ts`
  - [ ] Sub-task: Run `drizzle-kit generate` to create initial migration
  - [ ] Sub-task: Update `deno.json` task `db:migrate`
- [ ] Task: Conductor - User Manual Verification 'Database Setup' (Protocol in workflow.md)

## Phase 3: API Initialization (tRPC)

- [ ] Task: Install tRPC Dependencies
  - [ ] Sub-task: Add `@trpc/server`, `@trpc/client`, and `zod` to `deno.json` imports
- [ ] Task: Implement Health Check Endpoint
  - [ ] Sub-task: Write Tests: Create `api/test/trpc/health.test.ts`
  - [ ] Sub-task: Implement tRPC `initTRPC` builder and context
  - [ ] Sub-task: Implement `appRouter` with `health` procedure
  - [ ] Sub-task: Verify Tests Pass
- [ ] Task: Setup HTTP Server Entrypoint
  - [ ] Sub-task: Implement `api/src/main.ts` to serve tRPC router
  - [ ] Sub-task: Update `deno.json` task `dev` to run `api/src/main.ts`
- [ ] Task: Conductor - User Manual Verification 'API Initialization' (Protocol in workflow.md)
