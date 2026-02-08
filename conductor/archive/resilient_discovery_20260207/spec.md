# Specification: Resilient Discovery Safeguards

## Overview

Harden the discovery engine and ESI client against budget exhaustion and logical "dead ends." This track ensures perfect cross-worker synchronization of the ESI error budget and transforms the discovery worker into a reactive, event-driven service.

## Functional Requirements

1. **Strict Limiter Coordination:**
   - Update `esi_limiter.ts` to support frequent state re-synchronization.
   - Background workers must re-read the global limiter state from the database **before every ESI request**.
2. **ESI Client Unification (Gap Prober):**
   - Refactor `api/src/services/discovery/prober.ts` to use the unified `esi.ts` client.
   - Remove raw `fetch` usage to ensure all probes respect the error budget and update global limits.
3. **Smart Discovery Resolution:**
   - Update the Prober to utilize the `category` field returned by `/universe/names/` to correctly queue entities as `character`, `corporation`, or `alliance`.
4. **Reactive Discovery Worker:**
   - Remove hard-coded sleeps in `api/src/services/discovery/worker.ts`.
   - Implement a `queue_updated` event in the discovery event bus.
   - Workers must "wait" for the `queue_updated` signal when the queue is empty, ensuring instant response to new discovery tasks.

## Non-Functional Requirements

- **Precision:** Zero-tolerance for bypassing the ESI error budget.
- **Responsiveness:** Minimize discovery latency by removing timer-based polling in favor of event-driven execution.

## Acceptance Criteria

- Gap Prober correctly identifies and queues entities based on their ESI-reported category.
- All ESI requests (including probes) are tracked by the central limiter.
- Multiple workers correctly yield when the error budget is low, even if only one worker hit the errors.
- Workers wake up instantly when a new item is added to the queue.
