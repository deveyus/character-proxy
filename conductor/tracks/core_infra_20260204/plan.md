# Implementation Plan - Core Infrastructure

## [x] Phase 1: Project Configuration 762d240

- [x] Task: Initialize `deno.json` with import maps and task definitions f475446

    - [x] Sub-task: Create `deno.json` with strict typescript config

    - [x] Sub-task: Define tasks for `dev`, `test`, `lint`, `fmt`
- [x] Task: Verify and Update `flake.nix` for PostgreSQL support d1e57f7
    - [x] Sub-task: Ensure `postgresql` is in `buildInputs`
    - [x] Sub-task: Add shell hook to initialize/start a local postgres DB for dev if missing
- [x] Task: Conductor - User Manual Verification 'Project Configuration' (Protocol in workflow.md) 762d240

## Phase 2: Database Setup (Drizzle & Postgres)

- [x] Task: Install Drizzle ORM and Drivers 1ac0546
  - [x] Sub-task: Add `drizzle-orm` and `postgres` (or `postgres.js`) dependencies to `deno.json` imports
  - [x] Sub-task: Add `drizzle-kit` as a dev dependency
- [x] Task: Configure Drizzle and Database Connection f3a4ecb
  - [x] Sub-task: Write Tests: Create `api/test/db/connection.test.ts` expecting a successful DB ping
  - [x] Sub-task: Implement `api/src/db/client.ts` (Connection logic)
  - [x] Sub-task: Verify Tests Pass
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
