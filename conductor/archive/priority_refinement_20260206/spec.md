# Specification: Priority Intelligence Refinement

## Overview
Refine the discovery engine's priority and admission logic by implementing a weighted formula that prioritizes time exponentially while applying logarithmic diminishing returns to user demand.

## Functional Requirements
1.  **Refined Priority Formula:**
    -   Update the sorting logic in `api/src/services/discovery/queue.ts` (`claimTask`).
    -   The new formula: `(AgeInSeconds / 86400)^2 * log10(AccessCount + 10)`.
    -   SQL Implementation: `POWER(EXTRACT(EPOCH FROM (now - last_modified)) / 86400, 2) * LOG(access_count + 10)`.
2.  **Updated Maintenance Gate:**
    -   Update the re-queuing filter in `api/src/services/discovery/maintenance.ts` (`requeueStaleEntities`).
    -   Apply the same refined formula.
    -   Set the admission threshold to `0.125` (approximately 6 hours at baseline popularity).
3.  **Entity Schema Alignment:**
    -   Ensure `character_static`, `corporation_static`, and `alliance_static` all utilize the updated formula during maintenance scans.

## Non-Functional Requirements
-   **Performance:** The formula must be efficient for large table scans in PostgreSQL.
-   **Balance:** Prevent high-demand entities from starving older, less popular data by using logarithmic scaling for access counts.
-   **Exponential Staleness:** Ensure that very old data eventually becomes the highest priority regardless of access count.

## Acceptance Criteria
-   `claimTask` orders tasks according to the new formula.
-   `requeueStaleEntities` correctly identifies and re-queues entities exceeding the `0.125` urgency threshold.
-   The system remains stable under load with the new calculations.

## Out of Scope
-   Changes to the entity ingestion or extraction logic.
-   UI updates for the priority system.
