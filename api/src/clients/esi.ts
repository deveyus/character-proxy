import {
  canFetch,
  FetchPriority,
  getApiHealth,
  refreshLimiterState,
  updateApiHealth,
  updateLimits,
} from './esi_limiter.ts';
import { logger } from '../utils/logger.ts';

import { metrics } from '../utils/metrics.ts';

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
 * Checks the general status of the EVE Swagger Interface (ESI).
 *
 * Performance: High -- ESI
 * ESI: /status/
 *
 * Side-Effects: Updates the global API health state via `updateApiHealth`.
 *
 * @returns {Promise<boolean>} True if ESI is reported as 'up'.
 */
export async function checkApiStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${ESI_BASE_URL}/status/`);
    if (response.ok) {
      updateApiHealth('up');
      return true;
    }
    updateApiHealth('degraded');
    return false;
  } catch (_error) {
    updateApiHealth('down');
    return false;
  }
}

/**
 * Internal function for a single ESI fetch attempt.
 *
 * This function handles rate limit checking, metrics collection, and
 * error limit header processing.
 *
 * Performance: High -- ESI
 *
 * @template T
 * @param {string} path - The relative ESI path.
 * @param {string | null} [etag] - Optional E-Tag for conditional requests.
 * @param {FetchPriority} [priority='user'] - Priority level for rate limiting.
 * @returns {Promise<ESIResponse<T>>} The response from ESI.
 */
async function fetchOnce<T>(
  path: string,
  etag?: string | null,
  priority: FetchPriority = 'user',
  method = 'GET',
  body?: unknown,
): Promise<ESIResponse<T>> {
  if (priority === 'background') {
    await refreshLimiterState();
  }

  if (!canFetch(priority)) {
    metrics.inc('esi_errors_total');
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
    if (method === 'POST') {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${ESI_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    metrics.inc('esi_requests_total');

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
      metrics.inc('esi_errors_total');
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
    metrics.inc('esi_errors_total');
    return {
      status: 'error',
      type: 'network_error',
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Fetches an entity from ESI with E-Tag support, rate limit awareness, and smart retries.
 *
 * Performance: High -- ESI
 * Automatically handles exponential backoff for retryable errors (5xx, network).
 *
 * @template T
 * @param {string} path - The relative ESI path.
 * @param {string | null} [etag] - Optional E-Tag for conditional requests.
 * @param {FetchPriority} [priority='user'] - Priority level for rate limiting.
 * @returns {Promise<ESIResponse<T>>} The final response after retries.
 */
export async function fetchEntity<T>(
  path: string,
  etag?: string | null,
  priority: FetchPriority = 'user',
  method = 'GET',
  body?: unknown,
): Promise<ESIResponse<T>> {
  const maxRetries = 3;
  let lastResult: ESIResponse<T> | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (getApiHealth() === 'down' && priority === 'background') {
      return lastResult || {
        status: 'error',
        type: 'network_error',
        error: new Error('ESI is currently unreachable.'),
      };
    }

    const res = await fetchOnce<T>(path, etag, priority, method, body);

    if (res.status !== 'error') {
      return res;
    }

    lastResult = res;

    // Don't retry client errors (4xx) or rate limits (handled by canFetch)
    if (res.type === 'not_found' || res.type === 'forbidden' || res.type === 'rate_limited') {
      return res;
    }

    // Server or Network error - potentially retryable
    if (attempt < maxRetries) {
      metrics.inc('esi_retries_total');
      const backoffMs = Math.pow(2, attempt) * 1000;
      logger.warn('ESI', `Retryable error on ${path} (attempt ${attempt + 1}/${maxRetries + 1})`, {
        error: res.error.message,
        type: res.type,
        nextRetryIn: `${backoffMs}ms`,
      });

      // On server error, check if ESI is actually up
      if (res.type === 'server_error') {
        const isUp = await checkApiStatus();
        if (!isUp) {
          logger.error('ESI', 'Stopping retries: ESI /status/ reported issues.');
          return res;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  return lastResult!;
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
 *
 * Performance: High -- ESI
 * ESI: /characters/{id}/corporationhistory/
 *
 * @param {number} characterId - Target character ID.
 * @param {FetchPriority} [priority='background'] - Request priority.
 * @returns {Promise<ESIResponse<CorpHistoryEntry[]>>} The historical corporation list.
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
 *
 * Performance: High -- ESI
 * ESI: /corporations/{id}/alliancehistory/
 *
 * @param {number} corporationId - Target corporation ID.
 * @param {FetchPriority} [priority='background'] - Request priority.
 * @returns {Promise<ESIResponse<AllianceHistoryEntry[]>>} The historical alliance list.
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
 *
 * Performance: High -- ESI
 * ESI: /alliances/{id}/corporations/
 *
 * @param {number} allianceId - Target alliance ID.
 * @param {FetchPriority} [priority='background'] - Request priority.
 * @returns {Promise<ESIResponse<number[]>>} A list of member corporation IDs.
 */
export function getAllianceMembers(
  allianceId: number,
  priority: FetchPriority = 'background',
): Promise<ESIResponse<number[]>> {
  return fetchEntity<number[]>(`/alliances/${allianceId}/corporations/`, null, priority);
}
