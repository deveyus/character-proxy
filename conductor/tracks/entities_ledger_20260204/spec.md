# Specification: Core Entity Schema & Local Resolution

## Goal
Implement the data models for the three core entity types (Character, Corporation, Alliance) and a historical ledger to track state changes. Provide local resolution logic for ID and name lookups.

## Requirements

### 1. Database Schema
- **Entities:**
    - `characters`: `id` (int), `name` (text), `corporation_id` (int), `last_updated_at` (timestamp).
    - `corporations`: `id` (int), `name` (text), `alliance_id` (int, optional), `last_updated_at` (timestamp).
    - `alliances`: `id` (int), `name` (text), `last_updated_at` (timestamp).
- **Historical Ledger:**
    - `entity_history`: `id` (serial), `entity_id` (int), `entity_type` (enum: character, corporation, alliance), `data` (jsonb/text - *Note: User previously preferred SQL tables, but history needs to store the state snapshot. We will discuss if we want a generic history or type-specific history tables.*), `created_at` (timestamp).
    - *Refinement:* We will use **type-specific history tables** or a **change-log pattern** to stick to the "avoid JSONB" constraint in the Tech Stack.

### 2. Local Resolution Logic
- **tRPC Procedures:**
    - `resolveById`: Takes an `id` and `type`, returns the local record or `None`.
    - `resolveByName`: Takes a `name` and `type`, returns the local record or `None`.
- **Implementation:**
    - All lookups must return `Result<T, E>` using `ts-results-es`.

### 3. Standards
- Use `Int` for IDs (EVE IDs are 32-bit signed integers in most cases, but we should use 64-bit if needed for future-proofing, though standard Postgres `integer` is usually sufficient).
