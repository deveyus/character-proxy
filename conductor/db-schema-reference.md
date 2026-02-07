# Database Schema Reference

This document captures the PostgreSQL database schema as of February 6, 2026, before the removal of Drizzle ORM.

## Tables

### `character_static`

Stores relatively static data for EVE Characters.

- `character_id` (BIGINT): Primary Key.
- `name` (TEXT): Not NULL.
- `birthday` (TIMESTAMP): Not NULL.
- `gender` (TEXT): Not NULL.
- `race_id` (BIGINT): Not NULL.
- `bloodline_id` (BIGINT): Not NULL.
- `etag` (TEXT): For ESI cache management.
- `expires_at` (TIMESTAMP): ESI cache expiry.
- `last_modified_at` (TIMESTAMP): ESI last modified.
- `access_count` (BIGINT): Default 0, Not NULL. Used for priority.
- `last_discovery_at` (TIMESTAMP): When it was last extracted.
- **Indexes:**
  - `idx_character_last_discovery` on `last_discovery_at`.

### `character_ephemeral`

Historical ledger for dynamic character data.

- `record_id` (UUID): Primary Key (UUIDv7).
- `character_id` (BIGINT): Foreign Key to `character_static.character_id`.
- `corporation_id` (BIGINT): Not NULL.
- `alliance_id` (BIGINT).
- `security_status` (REAL): Not NULL.
- `recorded_at` (TIMESTAMP): Default NOW(), Not NULL.

### `corporation_static`

- `corporation_id` (BIGINT): Primary Key.
- `name` (TEXT): Not NULL.
- `ticker` (TEXT): Not NULL.
- `date_founded` (TIMESTAMP).
- `creator_id` (BIGINT).
- `faction_id` (BIGINT).
- `etag` (TEXT).
- `expires_at` (TIMESTAMP).
- `last_modified_at` (TIMESTAMP).
- `access_count` (BIGINT): Default 0, Not NULL.
- `last_discovery_at` (TIMESTAMP).
- **Indexes:**
  - `idx_corporation_last_discovery` on `last_discovery_at`.

### `corporation_ephemeral`

- `record_id` (UUID): Primary Key.
- `corporation_id` (BIGINT): Foreign Key to `corporation_static.corporation_id`.
- `alliance_id` (BIGINT).
- `ceo_id` (BIGINT): Not NULL.
- `member_count` (BIGINT): Not NULL.
- `recorded_at` (TIMESTAMP): Default NOW(), Not NULL.

### `alliance_static`

- `alliance_id` (BIGINT): Primary Key.
- `name` (TEXT): Not NULL.
- `ticker` (TEXT): Not NULL.
- `date_founded` (TIMESTAMP).
- `creator_id` (BIGINT): Not NULL.
- `creator_corporation_id` (BIGINT): Not NULL.
- `faction_id` (BIGINT).
- `etag` (TEXT).
- `expires_at` (TIMESTAMP).
- `last_modified_at` (TIMESTAMP).
- `access_count` (BIGINT): Default 0, Not NULL.
- `last_discovery_at` (TIMESTAMP).
- **Indexes:**
  - `idx_alliance_last_discovery` on `last_discovery_at`.

### `alliance_ephemeral`

- `record_id` (UUID): Primary Key.
- `alliance_id` (BIGINT): Foreign Key to `alliance_static.alliance_id`.
- `executor_corp_id` (BIGINT).
- `member_count` (BIGINT): Not NULL.
- `recorded_at` (TIMESTAMP): Default NOW(), Not NULL.

### `discovery_queue`

Discovery/Crawl task queue.

- `entity_id` (BIGINT): Not NULL.
- `entity_type` (TEXT): enum ('character', 'corporation', 'alliance'). Not NULL.
- `attempts` (BIGINT): Default 0, Not NULL.
- `locked_until` (TIMESTAMP).
- `created_at` (TIMESTAMP): Default NOW(), Not NULL.
- `updated_at` (TIMESTAMP): Default NOW(), Not NULL.
- **Primary Key:** (`entity_id`, `entity_type`).

### `system_state`

Generic KV store for system persistence (e.g., ESI limiter state).

- `key` (TEXT): Primary Key.
- `value` (JSONB): Not NULL.
- `updated_at` (TIMESTAMP): Default NOW(), Not NULL.

### `api_keys`

Application API keys.

- `id` (UUID): Primary Key.
- `key_hash` (TEXT): SHA-512 hash. Not NULL.
- `key_prefix` (TEXT): First 8 chars. Not NULL.
- `name` (TEXT): Not NULL.
- `created_at` (TIMESTAMP): Default NOW(), Not NULL.
- `last_used_at` (TIMESTAMP).
- `is_active` (BOOLEAN): Default TRUE, Not NULL.
