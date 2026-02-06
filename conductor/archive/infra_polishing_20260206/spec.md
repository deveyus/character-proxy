# Specification: Infrastructure Polishing & Poison Prevention

## Goal

Ensure the system's long-term stability and performance by optimizing maintenance queries, preventing "poison pill" tasks from blocking the queue, and managing resource usage (DB connections) more effectively.

## Requirements

### 1. Database Schema Enhancements

- **Discovery Tracking:** Add `last_discovery_at` (TIMESTAMP) to `character_static`, `corporation_static`, and `alliance_static`. This allows efficient indexed scans for stale entities.
- **Queue Cleanup:** Remove the `NOT IN` subquery in the maintenance worker. Use `last_discovery_at` to find entities that haven't been queued/checked recently.

### 2. Poison Pill & Dead-End Prevention

- **404 Handling:** If an ESI fetch returns `not_found`, the worker MUST immediately delete the task from the queue. Do not retry.
- **Max Attempts:** Implement a `MAX_ATTEMPTS` (default: 5) for discovery tasks. If exceeded, delete the task (or move to a log).
- **Transient Errors:** If a task fails due to `rate_limited` or `server_error`, do NOT increment `attempts` or mark as failed if it was a transient health issue. Simply release the lock.

### 3. Resource Management

- **Connection Pooling:** Configure the `postgres` client in `api/src/db/client.ts` with an explicit pool size based on `WORKER_COUNT`.
- **Worker Throttle:** Ensure the worker loop sleeps correctly when transient errors occur to avoid spinning.

### 4. Maintenance Logic

- Refactor `requeueStaleEntities` to use a single query per entity type that joins with the queue to check existence (efficiently) or simply relies on the `last_discovery_at` threshold.

## Standards

- Maintain functional style.
- Use structured logging for "Poison Pill" deletions.
