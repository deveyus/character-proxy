# Specification: Gap Discovery & Backfill

## Overview

Implement a proactive discovery engine that identifies "holes" in the local database by analyzing the integer spacing of existing entities. The engine prioritizes newest IDs and smallest gaps to backfill the database using bulk ESI probes.

## Functional Requirements

1. **Internal Gap Scanner:**
   - Implement a SQL-based process to identify gaps between existing IDs in `character_static` and `corporation_static`.
   - Priority Logic: Sort gaps by `start_id DESC` (newness) and `gap_size ASC` (probability).
2. **Frontier Scanner (High Water Mark):**
   - Maintain a binary search process to find the absolute maximum valid ID currently assigned by EVE Online for Characters and Corporations.
3. **Unified Probing Engine:**
   - A background loop that runs only when the discovery queue is empty.
   - Consumer of both "Internal Gaps" and "Frontier Space."
   - Probes IDs in blocks of 1,000 using ESI `/universe/names/`.
   - Any valid IDs returned are added to the `discovery_queue`.
4. **State Management:**
   - Persist the "current gap being scanned" and the "HWM" in `system_state`.
5. **Threshold Tuning:**
   - Update `maintenance.ts` threshold to `1.0` to allow the prober more idle time.

## Non-Functional Requirements

- **Minimal DB Impact:** Use efficient window functions for gap detection.
- **ESI Politeness:** Strictly opportunistic; runs only when the main queue is empty.
- **Atomic Queueing:** Use `addToQueue` to ensure discovered IDs are processed via standard service logic.

## Acceptance Criteria

- The system identifies missing IDs between existing records.
- The system finds the current maximum EVE ID via binary search.
- The prober backfills identified gaps without impacting user fetch priority.
- `deno test -A` passes.
