/**
 * Global state for tracking ESI error limits.
 */
let errorLimitRemain = 100;
let errorLimitReset = 0; // seconds until reset
let lastUpdate = 0;

const SAFETY_THRESHOLD = 10;

/**
 * Updates the global limit state based on ESI response headers.
 */
export function updateLimits(remain: number, reset: number) {
  errorLimitRemain = remain;
  errorLimitReset = reset;
  lastUpdate = Date.now();
}

/**
 * Checks if we are currently allowed to make a fetch to ESI.
 */
export function canFetch(): boolean {
  if (errorLimitRemain > SAFETY_THRESHOLD) {
    return true;
  }

  // If we are below threshold, check if the reset window has passed
  const elapsedSeconds = (Date.now() - lastUpdate) / 1000;
  if (elapsedSeconds > errorLimitReset) {
    // Reset window passed, assume we can try again
    // In a real scenario, the first call will update this with real values
    return true;
  }

  console.warn(
    `ESI Rate Limit Triggered: ${errorLimitRemain} remaining, reset in ${errorLimitReset}s`,
  );
  return false;
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
