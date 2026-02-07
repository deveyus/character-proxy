# Specification - Auth Integration

## Overview
This track covers the integration of the previously implemented `AuthService` into the main application logic (tRPC router) and the database schema.

## Components

### Database
- **Table:** `api_keys`
  - `id`: UUID (PK)
  - `keyHash`: SHA-512 hash of the key
  - `keyPrefix`: First 8 chars for identification
  - `name`: Human-readable label
  - `isActive`: Boolean flag

### tRPC Router
- **Protected Procedure:** Must validate `x-api-key` header against the DB.
- **Admin Procedure:** Must validate `x-api-key` against `MASTER_KEY` env var.
- **Endpoints:**
  - `registerApiKey(name)`: Returns `{ rawKey, id }` (Admin only)
  - `revokeApiKey(id)`: Returns success (Admin only)

### Security
- Raw keys are NEVER stored.
- Admin operations require a static `MASTER_KEY`.
- Standard operations require a dynamic, revocable key.
