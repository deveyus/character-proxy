// No imports needed for now if we don't use Result here, but we might need types later.
// For now let's just remove the unused line.

export type ESIResponse<T> =
  | { status: 'fresh'; data: T; etag: string; expiresAt: Date }
  | { status: 'not_modified'; expiresAt: Date }
  | { status: 'error'; error: Error };

const ESI_BASE_URL = 'https://esi.evetech.net/latest';

/**
 * Fetches an entity from ESI with E-Tag support.
 */
export async function fetchEntity<T>(
  path: string,
  etag?: string | null,
): Promise<ESIResponse<T>> {
  try {
    const headers: Record<string, string> = {};
    if (etag) {
      headers['If-None-Match'] = etag;
    }

    const response = await fetch(`${ESI_BASE_URL}${path}`, { headers });

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
