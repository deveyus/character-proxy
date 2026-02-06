import { logger } from '../utils/logger.ts';
import { getState, setState } from '../db/system_state.ts';

/**
 * Global state for tracking ESI error limits.
 */
let errorLimitRemain = 100;
let errorLimitReset = 60; // seconds until reset
let lastUpdate = 0;

export type FetchPriority = 'user' | 'background';
export type ApiHealth = 'up' | 'degraded' | 'down';

let apiHealth: ApiHealth = 'up';
let lastHealthCheck = 0;

/**
 * Loads the last known limiter state from the database.
 */
export async function initializeLimiter() {
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
    logger.info('ESI', 'Loaded persistent limiter state', {
      remain: errorLimitRemain,
      health: apiHealth,
    });
  }
}

/**
 * Syncs the current state to the database.
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
 * Thresholds for different priorities.
 * 'user' (tRPC) can keep going until we are very close to the limit.
 * 'background' (Discovery) should stop much earlier to reserve budget for users.
 */
const THRESHOLDS: Record<FetchPriority, number> = {
  user: 10,
  background: 50,
};

/**
 * Updates the global limit state based on ESI response headers.
 */
export function updateLimits(remain: number, reset: number) {
  errorLimitRemain = remain;
  errorLimitReset = reset;
  lastUpdate = Date.now();
  syncLimiter().catch((err) => logger.warn('ESI', `Failed to sync limiter: ${err.message}`));
}

/**
 * Updates the global API health state.
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
 * Gets the current API health.
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
 * Checks if we are currently allowed to make a fetch to ESI at the given priority.
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
 * Returns the raw remaining error count.
 */
export function getRemain(): number {
  return errorLimitRemain;
}

/**
 * Gets the current limit state for debugging/logging.
 */
export function getLimitState() {
  return {
    remain: errorLimitRemain,
    reset: errorLimitReset,
    health: apiHealth,
    lastUpdate,
  };
}
