# Implementation Plan: Management Frontend

## Phase 1: Infrastructure Migration

- [x] Task: Scaffold Hono & Static Assets 245942
  - [x] Update `deno.json` with Hono dependency.
  - [x] Refactor `api/src/main.ts` to use Hono instead of raw `Deno.serve`.
  - [x] Configure Hono to serve static files from `api/static/`.
- [x] Task: Mount tRPC on Hono 245942
  - [x] Integrate the existing tRPC router into the Hono application using `@trpc/server/adapters/fetch`.

## Phase 2: Real-Time Event Bridge

- [x] Task: Implement SSE Endpoint 246475
  - [x] Create `api/src/services/discovery/events.ts` to manage SSE clients.
  - [x] Create `/api/events` route in Hono.
  - [x] Connect the internal `onDiscoveryEvent` bus to broadcast events to all SSE clients.

## Phase 3: Responsive UI & Components

- [x] Task: Design Tokens & Layout aeb09e4
  - [x] Create `api/static/theme.css` with CSS Grid layouts and design tokens (variables).
  - [x] Implement a mobile-first `index.html` grid.
- [x] Task: Build Lit Components 247025
  - [x] Implement `<esi-budget>` widget with real-time SSE updates.
  - [x] Implement `<worker-status>` widget to track heartbeats.
  - [x] Implement `<queue-monitor>` widget for discovery metrics.

## Phase 4: Final Polishing

- [ ] Task: Full System Audit
  - [ ] Run `deno test -A`.
  - [ ] Run `deno lint`.
