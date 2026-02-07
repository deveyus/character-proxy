# Specification: Dynamic API Key Management

## Goal

Replace the single static environment variable API key with a dynamic, database-backed key registry. This allows issuing unique keys for different consumers and revoking them independently without restarting the service.

## Requirements

### 1. Database Schema (`api_keys` table)

- `id`: UUID (Primary Key)
- `key_hash`: TEXT (SHA-256 hash of the key)
- `key_prefix`: TEXT (First 8 characters for identification, e.g., `sk_live_...`)
- `name`: TEXT (Identifier for the owner/service)
- `created_at`: TIMESTAMP
- `last_used_at`: TIMESTAMP
- `is_active`: BOOLEAN (default true)

### 2. Key Generation & Registration

- **Mechanism:** Generate cryptographically secure random strings.
- **Issuance:** Provide a `registerApiKey` tRPC procedure.
  - **Security:** This procedure must itself be protected by a `MASTER_KEY` environment variable.
- **Revocation:** Provide a `revokeApiKey` procedure.

### 3. Authentication Middleware

- **Validation:** Look up the provided `x-api-key` in the `api_keys` table.
- **Optimization:** Implement a simple in-memory cache (e.g., Map with TTL) for valid keys to prevent a database hit on every single proxy request.
- **Audit:** Update `last_used_at` periodically (async).

### 4. CLI Management (Tooling)

- Create a Deno script `api/src/manage_keys.ts` to allow the user to add/list/revoke keys from the command line. This fits the single-instance operational model perfectly.

## Standards

- Maintain functional style.
- Use `crypto.subtle` for secure hashing.
- Never store raw keys in the database.
