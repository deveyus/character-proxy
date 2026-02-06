import { canFetch, FetchPriority, updateLimits } from './esi_limiter.ts';

export type ESIResponse<T> =
  | { status: 'fresh'; data: T; etag: string; expiresAt: Date }
  | { status: 'not_modified'; expiresAt: Date }
  | {
    status: 'error';
    error: Error;
    type: 'not_found' | 'forbidden' | 'rate_limited' | 'server_error' | 'network_error';
  };

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
      type: 'rate_limited',
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
      let type: 'not_found' | 'forbidden' | 'server_error' | 'network_error' = 'server_error';
      if (response.status === 404) type = 'not_found';
      if (response.status === 403 || response.status === 401) type = 'forbidden';

      return {
        status: 'error',
        type,
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
      type: 'network_error',
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export interface CorpHistoryEntry {
  corporation_id: number;
  record_id: number;
  start_date: string;
  is_deleted?: boolean;
}

export interface AllianceHistoryEntry {
  alliance_id: number;
  start_date: string;
  is_deleted?: boolean;
}

/**
 * Fetches a character's corporation history.
 */
export function getCharacterCorpHistory(
  characterId: number,
  priority: FetchPriority = 'background',
): Promise<ESIResponse<CorpHistoryEntry[]>> {
  return fetchEntity<CorpHistoryEntry[]>(
    `/characters/${characterId}/corporationhistory/`,
    null,
    priority,
  );
}

/**
 * Fetches a corporation's alliance history.
 */
export function getCorpAllianceHistory(
  corporationId: number,
  priority: FetchPriority = 'background',
): Promise<ESIResponse<AllianceHistoryEntry[]>> {
  return fetchEntity<AllianceHistoryEntry[]>(
    `/corporations/${corporationId}/alliancehistory/`,
    null,
    priority,
  );
}

/**
 * Fetches an alliance's member corporations.
 */
export function getAllianceMembers(
  allianceId: number,
  priority: FetchPriority = 'background',
): Promise<ESIResponse<number[]>> {
  return fetchEntity<number[]>(`/alliances/${allianceId}/corporations/`, null, priority);
}
