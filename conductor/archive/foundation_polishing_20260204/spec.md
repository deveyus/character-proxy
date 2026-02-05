# Specification: Foundation Polishing: Logging & Hydration

## Goal

Refine the application's internal visibility through structured logging and eliminate technical debt in the hydration process by using the established service layer.

## Requirements

### 1. Structured Logger (`api/src/utils/logger.ts`)

- Provide a consistent logging interface: `info`, `warn`, `error`, `debug`.
- Log output must follow the format: `[TIMESTAMP] [TAG] Message`.
- Tags:
  - `[ESI]`: External API interactions.
  - `[DB]`: Database operations.
  - `[CACHE]`: Cache hits/misses/TTL logic.
  - `[SYSTEM]`: Startup, shutdown, and general management.
- Integration: Replace all raw `console` calls in the `api/src/` directory.

### 2. Hydration Refactor (`api/src/db/hydration/npc_corps.ts`)

- Remove all direct Drizzle SQL logic and manual ESI `fetch` calls.
- Use `corporationService.getById(id, maxAge)` to perform the hydration.
- **Benefit:** NPC corporations will automatically populate the historical ledger and store E-Tags/Expiry metadata correctly.
- Use a long `maxAge` (e.g., 7 days) for NPC hydration to avoid redundant ESI calls on every startup.

## Standards

- Maintain functional style.
- Ensure the logger is easily switchable to JSON format in the future if needed for ELK/Grafana.
