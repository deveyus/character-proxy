# Specification: Entity Lifecycle & Tombstoning

## Overview

Implement a robust tombstoning mechanism to track the "End of Life" for Characters, Corporations, and Alliances. This ensures that the system accurately reflects deletions and closures based on ESI signals.

## Functional Requirements

1. **Schema Updates:**
   - Add `terminated_at` (TIMESTAMP, nullable) to `character_static`, `corporation_static`, and `alliance_static`.
   - Update Zod schemas (`CharacterStaticSchema`, etc.) in `api/src/db/` to include `terminatedAt`.
2. **Character Tombstoning:**
   - In `characterService`, if an ESI fetch for a **known** character (exists in `character_static`) returns a 404, set `terminated_at` to the current time.
   - Unknown characters (404 for an ID not in our DB) should **not** create a record.
3. **Corporation/Alliance Termination:**
   - Alliances: Capture `date_terminated` from ESI and store it in `terminated_at`.
   - Corporations: Handle 404s for known corporations by setting `terminated_at`. Capture `date_terminated` if present in ESI response.
4. **API Transparency:**
   - Ensure `resolveById` and `resolveByName` return the `terminatedAt` field.

## Non-Functional Requirements

- **Resilience:** Don't delete data; mark it as terminated to preserve the historical ledger.
- **No Sunk Cost:** Update Grand Baseline directly as the project is in pre-v1.
