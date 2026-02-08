import { logger } from '../utils/logger.ts';
import { getState, setState } from '../db/system_state.ts';

/**
 * Global state for tracking EVE Swagger Interface (ESI) error limits.
 *
 * ESI enforces a global error limit. If we exceed this limit, our IP may be
 * temporarily blocked. This limiter ensures we yield before hitting that threshold.
 */
let errorLimitRemain = 100;
let errorLimitReset = 60; // seconds until reset
let lastUpdate = 0;

/**
 * Categorizes requests to allow for tiered rate-limiting.
 * - 'user': Requests triggered by direct human interaction (tRPC).
 * - 'background': Automated crawler tasks.
 */
export type FetchPriority = 'user' | 'background';

/**
 * Represents the overall availability of the external ESI service.
 */
export type ApiHealth = 'up' | 'degraded' | 'down';

let apiHealth: ApiHealth = 'up';
let lastHealthCheck = 0;

/**
 * Restores the ESI limiter state from the database.
 *
 * Performance: Low -- DB Read
 * Should be called during application bootstrap.
 */
export async function initializeLimiter() {
  const result = await refreshLimiterState();
  if (result) {
    logger.info('ESI', 'Loaded persistent limiter state', {
      remain: errorLimitRemain,
      health: apiHealth,
    });
  }
}

/**
 * Re-reads the limiter state from the database.
 * Used by background workers to ensure they stay synchronized with other instances.
 *
 * Performance: Low -- DB Read
 * @returns {Promise<boolean>} True if the state was successfully refreshed.
 */
export async function refreshLimiterState(): Promise<boolean> {
  const stateResult = await getState<{
    remain: number;
    reset: number;
    health: ApiHealth;
    lastUpdate: number;
  }>('esi_limiter');

  if (stateResult.isOk() && stateResult.value) {
    const s = stateResult.value;
    errorLimitRemain = s.remain;
    errorLimitReset = s.reset;
    apiHealth = s.health;
    lastUpdate = s.lastUpdate;
    return true;
  }
  return false;
}

/**
 * Persists the current limiter and health state to the database.
 *
 * Side-Effects: Writes to `system_state` table.
 * Performance: Medium -- DB Write
 */
async function syncLimiter() {
  await setState('esi_limiter', {
    remain: errorLimitRemain,
    reset: errorLimitReset,
    health: apiHealth,
    lastUpdate,
  });
}

/**
 * Error limit thresholds per priority level.
 *
 * 'user' requests are allowed until we have only 10 errors remaining.
 * 'background' tasks are cut off at 50 errors to preserve budget for users.
 */
const THRESHOLDS: Record<FetchPriority, number> = {
  user: 10,
  background: 50,
};

/**
 * Updates the internal error limit state based on ESI response headers.
 *
 * Side-Effects: Triggers an asynchronous database sync.
 *
 * @param {number} remain - Value from `x-esi-error-limit-remain`.
 * @param {number} reset - Value from `x-esi-error-limit-reset`.
 */
export function updateLimits(remain: number, reset: number) {
  errorLimitRemain = remain;
  errorLimitReset = reset;
  lastUpdate = Date.now();
  syncLimiter().catch((err) => logger.warn('ESI', `Failed to sync limiter: ${err.message}`));
}

/**
 * Updates the perceived health of the ESI service.
 *
 * Side-Effects: Triggers an asynchronous database sync.
 *
 * @param {ApiHealth} health - The new health status.
 */
export function updateApiHealth(health: ApiHealth) {
  apiHealth = health;
  lastHealthCheck = Date.now();
  if (health !== 'up') {
    logger.warn('ESI', `API Health updated to: ${health.toUpperCase()}`);
  }
  syncLimiter().catch((err) => logger.warn('ESI', `Failed to sync limiter: ${err.message}`));
}

/**
 * Retrieves the current API health status.
 *
 * Note: If the API is unhealthy but the last check was more than 30 seconds ago,
 * this function returns 'up' to allow a probe request.
 *
 * @returns {ApiHealth} The current health status.
 */
export function getApiHealth(): ApiHealth {
  // If health is not 'up', but it's been a while since the last check,
  // allow a probe (effectively 'up' for the next request).
  if (apiHealth !== 'up' && Date.now() - lastHealthCheck > 30000) {
    return 'up';
  }
  return apiHealth;
}

/**
 * Evaluates if a request is allowed based on the current error limit and priority.
 *
 * @param {FetchPriority} [priority='user'] - The priority of the incoming request.
 * @returns {boolean} True if the request is permitted.
 */
export function canFetch(priority: FetchPriority = 'user'): boolean {
  if (apiHealth === 'down' && priority === 'background') {
    return false;
  }

  const threshold = THRESHOLDS[priority];

  if (errorLimitRemain > threshold) {
    return true;
  }

  // If we are below threshold, check if the reset window has passed
  const elapsedSeconds = (Date.now() - lastUpdate) / 1000;
  if (lastUpdate > 0 && elapsedSeconds > errorLimitReset) {
    // Reset window passed, assume we can try again.
    // The next response will calibrate this with real values.
    return true;
  }

  logger.warn(
    'ESI',
    `ESI Rate Limit Active [${priority}]: ${errorLimitRemain} remaining, reset in ${errorLimitReset}s`,
  );
  return false;
}

/**
 * Returns the number of errors remaining in the current ESI window.
 *
 * @returns {number} The error limit remainder.
 */
export function getRemain(): number {
  return errorLimitRemain;
}

/**
 * Captures a snapshot of the current limiter state for monitoring.
 *
 * @returns {Object} Current remain, reset, health, and lastUpdate values.
 */
export function getLimitState() {
  return {
    remain: errorLimitRemain,
    reset: errorLimitReset,
    health: apiHealth,
    lastUpdate,
  };
}
