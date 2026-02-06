# Specification: Observability & Security

## Goal

Enhance the system's visibility and security by implementing worker heartbeats, detailed metrics tracking, and a simple API key authentication layer.

## Requirements

### 1. Worker Heartbeat & Monitoring

- **Heartbeat:** Each worker must update a timestamp in the `system_state` table every 60 seconds.
- **Exposure:** Create a `getSystemStatus` tRPC procedure that returns the current health of all workers and the ESI limiter.

### 2. Metrics Collection

- **Metrics Store:** Create a singleton metrics collector in the API to track:
  - `esi_requests_total` (labels: status, priority)
  - `esi_retries_total`
  - `cache_hits_total`
  - `cache_misses_total`
  - `discovery_queue_processed_total`
- **Exposure:** Metrics should be viewable via a tRPC procedure.

### 3. API Security (Simple Auth)

- **API Key:** Implement an `API_KEY` requirement for all tRPC procedures (except `health`).
- **Context:** Extract the key from headers in `createTRPCContext`.

### 4. Logging Enhancements

- **Tagging:** Ensure all logs use consistent tags (`[ESI]`, `[WORKER]`, `[AUTH]`, etc.).
- **Content:** Include critical IDs and timing information in log attributes.

## Standards

- Maintain functional style.
- Use `logger` for all observability events.
