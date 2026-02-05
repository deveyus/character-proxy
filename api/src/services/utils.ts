export interface Metadata {
  source: 'fresh' | 'cache' | 'stale';
  expiresAt: Date;
  lastModifiedAt: Date;
}

export interface ServiceResponse<T> {
  data: T | null;
  metadata: Metadata;
}

/**
 * Determines if we should attempt a fetch from ESI based on current state and maxAge requirements.
 */
export function shouldFetch(
  expiresAt: Date | null,
  lastModifiedAt: Date | null,
  maxAge?: number,
): boolean {
  const now = new Date();

  // Hard Floor: ESI strict validity
  if (expiresAt && now < expiresAt) {
    return false;
  }

  // Soft TTL: User's freshness requirement
  if (maxAge !== undefined && lastModifiedAt) {
    const ageSeconds = (now.getTime() - lastModifiedAt.getTime()) / 1000;
    if (ageSeconds < maxAge) {
      return false;
    }
  }

  // If no maxAge provided and ESI cache is expired, always fetch
  // If maxAge provided and we are older than it, always fetch
  return true;
}
