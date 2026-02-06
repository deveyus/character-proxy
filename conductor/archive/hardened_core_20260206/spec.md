# Specification: Hardened Core & Smart Priority

## Goal

Strengthen the system's architectural foundations by implementing atomic queue management, persistent state to prevent "ESI budget amnesia," and a smart entity refresh priority system based on user demand and age.

## Requirements

### 1. Database Schema Updates

- **Access Tracking:** Add `access_count` (BIGINT, default 0) to `character_static`, `corporation_static`, and `alliance_static`.
- **Atomic Queue:**
  - Add `locked_until` (TIMESTAMP) to `discovery_queue`.
  - Remove `status` and `attempts` from `discovery_queue` (we will delete on success and use `locked_until` for concurrency). Actually, keeping `attempts` is useful for backoff, but `status` can be inferred. However, `FOR UPDATE SKIP LOCKED` is the priority. Let's keep it simple: Delete on success.
- **System State:** Create `system_state` table:
  - `key` (TEXT, Primary Key)
  - `value` (JSONB)
  - `updated_at` (TIMESTAMP)

### 2. Atomic Queue Management

- Refactor `claimTask`: Use `DELETE ... RETURNING` or `UPDATE ... SKIP LOCKED` to ensure only one worker handles a task.
- Implement **Lock Expiry**: Workers can claim items where `locked_until` is NULL or in the past.

### 3. Persistent ESI Limiter

- The ESI Limiter must periodically (or on change) sync its `errorLimitRemain` and `errorLimitReset` to the `system_state` table.
- On startup, the system must load the last known state to avoid "ESI budget amnesia."

### 4. Smart Priority & Access Counting

- **Access Counter:** Increment `access_count` only when a request's `priority` is `user`.
- **Urgency Formula:** Discovery worker should prioritize items using a weighted formula: `(Now - last_modified) * (access_count + 1)`.

### 5. Multi-Worker Orchestration

- Use `WORKER_COUNT` environment variable to spawn multiple parallel worker loops in `main.ts`.

## Standards

- **Transactional Integrity:** Wrap entity ingestion (Static + Ephemeral + Queue) in database transactions.
- **12-Factor Compliance:** All state stored in DB; configuration via environment variables.
