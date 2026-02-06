# Specification: Resilient ESI Communication

## Goal

Enhance the ESI client with intelligent retry logic and health monitoring. This ensures the application can handle transient network failures or server-side hiccups gracefully without overwhelming the API or reporting false negatives to users.

## Requirements

### 1. Exponential Backoff Retries

Implement a retry mechanism for `fetchEntity`:
- **Retryable Errors:** 5xx Server Errors, Network/Timeout errors.
- **Non-Retryable Errors:** 4xx Request Errors (e.g., 404, 403, 400).
- **Strategy:** Exponential backoff (e.g., 1s, 2s, 4s).
- **Max Retries:** 3 attempts before giving up.

### 2. API Health Monitoring

- **Status Check:** Implement a periodic or on-demand check of the `/status/` endpoint.
- **Circuit Breaker Integration:** If `/status/` fails or reports issues, temporarily increase the backoff or pause background discovery.
- **Fast Fail:** If a 5xx occurs, check `/status/` immediately. If `/status/` is also down, stop retrying immediately and return a "Service Unavailable" state.

### 3. Error Classification

Refine the `ESIResponse` to distinguish between types of errors:
- `not_found` (404)
- `forbidden` (403)
- `rate_limited` (420/Circuit Breaker)
- `server_error` (5xx)
- `network_error` (Fetch failures)

## Architecture

- **Client Layer:** Update `api/src/clients/esi.ts`.
- **Limiter Layer:** Enhance `api/src/clients/esi_limiter.ts` to track "API Health" state.

## Standards

- Maintain functional style.
- Use `logger` with structured attributes for all retry attempts.
- Ensure the discovery worker respects the "API Health" state.
