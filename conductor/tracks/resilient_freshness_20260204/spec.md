# Specification: Resilient Freshness & Rate Management

## Goal

Implement intelligent TTL (Time-To-Live) management and robust ESI rate-limit tracking to ensure the proxy remains resilient, never exceeds error limits, and respects user-defined freshness requirements.

## Requirements

### 1. ESI Rate Limit Tracker (`api/src/clients/esi_limiter.ts`)

- Maintain a global (in-memory) state of the ESI error limit.
- Parse `X-Esi-Error-Limit-Remain` and `X-Esi-Error-Limit-Reset` from every ESI response.
- **Circuit Breaker:** If `Remain` falls below a safety threshold (e.g., 10), block all outgoing ESI calls until the `Reset` window passes.
- Provide a `canFetch()` method for the service layer.

### 2. Smart TTL Logic

Update service functions (`getById`, `getByName`) to accept an optional `maxAge` (seconds).
- **Hard Floor:** `expiresAt` from ESI is the absolute truth. If `now < expiresAt`, always serve from local DB.
- **Soft TTL:** If `now > expiresAt` AND `now - lastModifiedAt < maxAge`, serve from local DB.
- **Force Refresh:** If `now > expiresAt` AND `now - lastModifiedAt >= maxAge`, trigger ESI fetch.

### 3. Resilience & Fallback

If an ESI fetch is required but:

- `canFetch()` is false (Rate Limited).

- ESI returns a 5xx error or network failure.
  **Action:** Return the latest local data (even if expired) and explicitly mark the response metadata as `source: 'stale'`.

### 4. Enriched Response Schema

All tRPC entity queries must return a consistent wrapper:

```ts
{
  data: EntityData | null,
  metadata: {
    source: 'fresh' | 'cache' | 'stale',
    expiresAt: Date,
    lastModifiedAt: Date
  }
}
```

## Standards

- Maintain functional style.
- Centralize TTL logic to avoid duplication across Character/Corp/Alliance services.
- Ensure the Rate Limiter is thread-safe (Deno's single-process model makes this simple via shared module state).
