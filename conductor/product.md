# Initial Concept

This is a service used by other tools to access the Eve Online API; acting as an enriched cache, local source, and discovery/crawler.

# Target Users

- **Tool Developers:** Developers creating applications that need to interface with the Eve Online API.
- **Third-Party Tools:** External services requiring a stable, enriched, and rate-limit-safe source of Eve Online data.

# Core Technical Goals

- **Resilient Caching:** Implement a performance-focused caching layer for the Eve Swagger Interface (ESI) specifically designed to prevent rate-limiting issues.
- **Proactive Discovery Engine:** Automatically discover and crawl Characters, Corporations, and Alliances through a hybrid of data inference and systematic ID space probing to backfill gaps in the historical record. **Note:** Market Data is explicitly out of scope.
- **Historical Ledger:** Maintain a comprehensive log of changes for tracked entities over time.
- **Smart Querying:** Provide "Just-In-Time" data retrieval that intelligently balances the current cache age against the specific freshness requirements of each incoming request.

# Architecture & Interfaces

- **Primary Stack:** TypeScript (Full Stack).
- **API Layer:** **tRPC**. Chosen for its end-to-end type safety and developer experience, bridging the backend and frontend without the complexity of gRPC or the boilerplate of manual REST specifications.
