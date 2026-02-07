# Implementation Plan: Documentation & JSDoc Hardening

## Phase 1: Foundation & Utilities
- [x] Task: Document Database Layer bd046ae
    - [x] Audit `api/src/db/` (character, corporation, alliance, common, client, system_state, utils).
    - [x] Update JSDoc with precise types, side-effect notes, and `@param`/`@returns`.
- [~] Task: Document Core Utilities
    - [ ] Audit `api/src/utils/` (bio_parser, logger, metrics, result).
    - [ ] Add `@example` blocks for fallible functions returning `Result`.
- [ ] Task: Conductor - User Manual Verification 'Foundation & Utilities' (Protocol in workflow.md)

## Phase 2: Client & Infrastructure
- [ ] Task: Document ESI Client
    - [ ] Audit `api/src/clients/` (esi, esi_limiter, esi_schemas).
    - [ ] Add `Performance: High -- ESI` notes and ESI path templates (e.g., `ESI: /.../`).
- [ ] Task: Document Auth & System Infrastructure
    - [ ] Audit `api/src/services/auth.ts` and `api/src/services/system.ts`.
    - [ ] Document side-effects (DB writes, key hashing) and performance implications.
- [ ] Task: Conductor - User Manual Verification 'Client & Infrastructure' (Protocol in workflow.md)

## Phase 3: Entity Services & Discovery
- [ ] Task: Document Entity Services
    - [ ] Audit `api/src/services/` (character, corporation, alliance).
    - [ ] Add `@example` blocks showing `tRPC`-ready usage and `Result` handling.
    - [ ] Mark background discovery triggers as side-effects.
- [ ] Task: Document Discovery Engine
    - [ ] Audit `api/src/services/discovery/` (extraction, frontier, maintenance, prober, queue, worker).
    - [ ] Document complex logic (binary search, gap detection) with performance notes.
- [ ] Task: Conductor - User Manual Verification 'Entity Services & Discovery' (Protocol in workflow.md)

## Phase 4: Final Project Audit
- [ ] Task: Project-Wide Standards Verification
    - [ ] Run `deno check` to ensure no type regressions.
    - [ ] Run `deno lint` to ensure documentation doesn't violate any lint rules.
- [ ] Task: Conductor - User Manual Verification 'Final Project Audit' (Protocol in workflow.md)
