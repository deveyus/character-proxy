/**
 * Global state for tracking ESI error limits.
 * ESI allows 100 errors per minute per IP.
 */
let errorLimitRemain = 100;
let errorLimitReset = 60; // seconds until reset
let lastUpdate = 0;

export type FetchPriority = 'user' | 'background';

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
}

/**
 * Checks if we are currently allowed to make a fetch to ESI at the given priority.
 */
export function canFetch(priority: FetchPriority = 'user'): boolean {
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

  console.warn(
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
    lastUpdate,
  };
}
