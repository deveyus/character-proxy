# Specification: Dynamic API Key Management (PQC Hardened)

## Goal

Replace the single static environment variable API key with a dynamic, database-backed key registry. This allows issuing unique keys for different consumers and revoking them independently. The system will use post-quantum resistant hashing (SHA3-512) and derivation.

## Requirements

### 1. Database Schema (`api_keys` table)

- `id`: UUID (Primary Key)
- `key_hash`: TEXT (SHA3-512 hash of the key)
- `key_prefix`: TEXT (First 8 characters for identification, e.g., `sk_live_...`)
- `name`: TEXT (Identifier for the owner/service)
- `created_at`: TIMESTAMP
- `last_used_at`: TIMESTAMP
- `is_active`: BOOLEAN (default true)

### 2. Key Generation & Registration

- **Mechanism:** Generate keys using SHAKE256 (part of the Keccak family) to ensure post-quantum entropy.
- **Issuance:** Provide a `registerApiKey` tRPC procedure.
  - **Security:** This procedure must itself be protected by a `MASTER_KEY` environment variable.
- **Revocation:** Provide a `revokeApiKey` procedure.

### 3. Authentication Middleware

- **Validation:** Hash the incoming key with SHA3-512 and look it up in the `api_keys` table.
- **Optimization:** Implement a simple in-memory cache (e.g., Map with TTL) for valid keys.

### 4. CLI Management (Tooling)

- Create a Deno script `api/src/manage_keys.ts` to allow the user to add/list/revoke keys from the command line.

## Standards

- Maintain functional style.
- Use SHA3-512 for storage hashing.
- Use SHAKE256 for key generation (variable-length output, PQC-ready).
- Never store raw keys in the database.
