# Specification: ESI Proxy & Cache Management

## Goal

Implement an intelligent service layer that acts as a smart proxy for the Eve Online ESI. It will manage E-Tag based caching, respect expiration headers, and automatically update the historical ledger when changes are detected.

## Requirements

### 1. Schema Enhancement (Static Tables)

Add cache-related metadata to `character_static`, `corporation_static`, and `alliance_static`:

- `etag`: `text` (The E-Tag returned by ESI).
- `expires_at`: `timestamp` (When the cache expires).
- `last_modified_at`: `timestamp` (When we last received a 200 OK).

### 2. ESI Client (`api/src/clients/esi.ts`)

- Provide a functional interface for fetching from ESI.
- Support `If-None-Match` header using stored E-Tags.
- Return a discriminated union or specialized Result indicating the outcome:
  - `Fresh(data, etag, expiresAt)` (200 OK)
  - `NotModified` (304 Not Modified)
  - `Error(error)`

### 3. Service Layer (`api/src/services/entity.ts`)

- Implement `getCharacter`, `getCorporation`, `getAlliance`.
- **Logic Flow:**
  1. Look up entity in local `db/entity.ts`.
  2. If not found, or if `expiresAt < now`:
     a. Call ESI Client with the current `etag`.
     b. If `Fresh`: Update Static cache headers AND append new state to Ephemeral ledger.
     c. If `NotModified`: Update Static `expiresAt` and `lastModifiedAt` only.
  3. Return the latest state (from local DB).

### 4. Persistence Refactor

- Rename `api/src/db/repos/entity.repo.ts` to `api/src/db/entity.ts`.
- Ensure all "db" functions are in the `db/` folder and strictly handle SQL.
- Remove business/cache logic from the DB layer.

## Standards

- No classes.
- Use `ts-results-es` for all operations.
- Strictly functional exports.
