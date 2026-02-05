import { canFetch, FetchPriority, updateLimits } from './esi_limiter.ts';

export type ESIResponse<T> =
  | { status: 'fresh'; data: T; etag: string; expiresAt: Date }
  | { status: 'not_modified'; expiresAt: Date }
  | { status: 'error'; error: Error };

const ESI_BASE_URL = 'https://esi.evetech.net/latest';

/**
 * Fetches an entity from ESI with E-Tag support and rate limit awareness.
 */
export async function fetchEntity<T>(
  path: string,
  etag?: string | null,
  priority: FetchPriority = 'user',
): Promise<ESIResponse<T>> {
  if (!canFetch(priority)) {
    return {
      status: 'error',
      error: new Error(`Rate limit circuit breaker active [${priority}]. Local cache only.`),
    };
  }

  try {
    const headers: Record<string, string> = {};
    if (etag) {
      headers['If-None-Match'] = etag;
    }

    const response = await fetch(`${ESI_BASE_URL}${path}`, { headers });

    // Update limits from headers
    const remain = response.headers.get('x-esi-error-limit-remain');
    const reset = response.headers.get('x-esi-error-limit-reset');
    if (remain && reset) {
      updateLimits(parseInt(remain), parseInt(reset));
    }

    const expiresHeader = response.headers.get('expires');
    const expiresAt = expiresHeader ? new Date(expiresHeader) : new Date(Date.now() + 60000);

    if (response.status === 304) {
      return { status: 'not_modified', expiresAt };
    }

    if (!response.ok) {
      return {
        status: 'error',
        error: new Error(`ESI returned ${response.status}: ${response.statusText}`),
      };
    }

    const data = await response.json();
    const newEtag = response.headers.get('etag') || '';

    return {
      status: 'fresh',
      data,
      etag: newEtag,
      expiresAt,
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
