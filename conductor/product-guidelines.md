# Product Guidelines

## Communication Style

- **Technical & Precise:** API responses and internal logs prioritize accuracy and clarity. Logs should be descriptive enough for developers to debug complex caching and discovery cycles without excessive noise.
- **Structured Documentation:** Internal codebase documentation utilizes standardized JSDoc to improve explorability.
  - **Side-Effects:** Functions explicitly declare side-effects (e.g., database writes, background discovery triggers).
  - **Performance Awareness:** High-latency functions include a "Performance" heading indicating the impact (e.g., `High -- ESI`, `Medium -- DB Scan`).
  - **Usage Examples:** Core service and fallible utility functions include `@example` blocks demonstrating idiomatic usage and Result-based error handling.

## Data & Storage Guidelines

- **Ledger-Based History:** Separate static data from dynamic data. Only store entries when a change is detected.
- **Infinite Retention:** Due to the relatively low frequency of entity changes (Characters, Corps, Alliances), maintain a permanent record of all historical state transitions.
- **Efficiency:** Prioritize storage patterns that minimize redundancy while preserving the full historical audit trail.
- **Tombstoning:** Formally track the dissolution of entities (deletion, closure, or termination) using a `terminated_at` field. This transforms system errors (404s) into domain knowledge for known entities.

## Performance & Reliability

- **Resource Management:** Balance data freshness with ESI rate-limit conservation. Avoid redundant API calls that could be better utilized for the discovery/crawling engine.
- **Smart Retries:** Implement **Exponential Backoff** for all ESI interactions to respect API health.
- **Intelligent Prioritization:** Utilize a non-linear priority formula—weighting time exponentially and user demand logarithmically—to ensure critical data remains fresh while eventually guaranteeing that all known entities are crawled.
- **Resilience:** In the event of ESI downtime, serve cached data (Graceful Degradation) while explicitly marking the response as stale.

## User Interface (Management Frontend)

- **Minimalist Design:** Focus on a clean, uncluttered interface. While the frontend is secondary, it should provide a high-signal-to-noise ratio for monitoring the state of the proxy and discovery progress.
