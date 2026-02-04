# Specification: Core Entity Schema & Local Resolution

## Goal
Implement the data models for the three core entity types (Character, Corporation, Alliance) and a historical ledger to track state changes. Provide local resolution logic for ID and name lookups.

## Requirements

### 1. Database Schema
- **Design Pattern:** 2 tables per entity (Static vs. Ephemeral). Ephemeral tables are append-only to form the historical ledger.
- **Character Tables:**
    - `character_static`: `id` (int, pk), `name` (text), `birthday` (timestamp).
    - `character_ephemeral`: `id` (serial, pk), `character_id` (int, fk), `corporation_id` (int), `security_status` (float), `recorded_at` (timestamp).
- **Corporation Tables:**
    - `corporation_static`: `id` (int, pk), `name` (text), `ticker` (text).
    - `corporation_ephemeral`: `id` (serial, pk), `corporation_id` (int, fk), `alliance_id` (int, optional), `member_count` (int), `recorded_at` (timestamp).
- **Alliance Tables:**
    - `alliance_static`: `id` (int, pk), `name` (text), `ticker` (text).
    - `alliance_ephemeral`: `id` (serial, pk), `alliance_id` (int, fk), `executor_corp_id` (int, optional), `member_count` (int), `recorded_at` (timestamp).
- **Constraints:** No JSONB. Use `Int` for EVE IDs.

### 2. Local Resolution Logic
- **tRPC Procedures:**
    - `resolveById`: Takes an `id` and `type`, returns the local record or `None`.
    - `resolveByName`: Takes a `name` and `type`, returns the local record or `None`.
- **Implementation:**
    - All lookups must return `Result<T, E>` using `ts-results-es`.

### 3. Standards
- Use `Int` for IDs (EVE IDs are 32-bit signed integers in most cases, but we should use 64-bit if needed for future-proofing, though standard Postgres `integer` is usually sufficient).
