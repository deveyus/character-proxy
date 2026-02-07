import { encodeBase64 } from 'std/encoding/base64.ts';
import { encodeHex } from 'std/encoding/hex.ts';
import { sql, Tx } from '../db/client.ts';
import { z } from 'zod';
import { AuditTimestampsSchema } from '../db/common.ts';
import { Err, Ok, Result } from 'ts-results-es';
import { logger } from '../utils/logger.ts';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const keyCache = new Map<string, { isValid: boolean; expiry: number }>();

// --- Schemas ---

export const ApiKeySchema = z.object({
  id: z.string().uuid(),
  keyHash: z.string(),
  keyPrefix: z.string(),
  name: z.string(),
  lastUsedAt: z.date().nullable(),
  isActive: z.boolean(),
}).merge(AuditTimestampsSchema);

export type ApiKey = z.infer<typeof ApiKeySchema>;

/**
 * Hashes a raw API key using SHA-512.
 */
export async function hashKey(rawKey: string): Promise<string> {
  const data = new TextEncoder().encode(rawKey);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  return encodeHex(hashBuffer);
}

/**

 * Generates a new unique API key using SHAKE256.

 * Returns the raw key (to be shown once to the user) and its hash (for storage).

 */

export async function generateNewKey(name: string, tx: Tx = sql): Promise<Result<{ rawKey: string; id: string }, Error>> {

  try {

    // 1. Generate 32 bytes of high-entropy random data

    const entropy = crypto.getRandomValues(new Uint8Array(32));

    

    // 2. Pass through SHA-256 to derive the key bytes

    const derivedBuffer = await crypto.subtle.digest('SHA-256', entropy);

    const rawKey = `cp_${encodeBase64(derivedBuffer).replace(/[+/=]/g, '').substring(0, 48)}`;

    

    // 3. Hash for storage

    const keyHash = await hashKey(rawKey);

    const keyPrefix = rawKey.substring(0, 8);



    // 4. Store in DB

    const [inserted] = await tx`

      INSERT INTO api_keys (name, key_hash, key_prefix)

      VALUES (${name}, ${keyHash}, ${keyPrefix})

      RETURNING id

    `;



    return Ok({ rawKey, id: inserted.id });

  } catch (error) {

    return Err(error instanceof Error ? error : new Error(String(error)));

  }

}



/**

 * Validates an incoming API key.

 */

export async function validateKey(rawKey: string, tx: Tx = sql): Promise<boolean> {

  if (!rawKey) return false;



  // 1. Check in-memory cache

  const cached = keyCache.get(rawKey);

  if (cached && cached.expiry > Date.now()) {

    return cached.isValid;

  }



  try {

    // 2. Hash and lookup

    const keyHash = await hashKey(rawKey);

    const rows = await tx`

      SELECT id

      FROM api_keys

      WHERE key_hash = ${keyHash} AND is_active = true

      LIMIT 1

    `;



    const match = rows[0];

    const isValid = !!match;



    // 3. Update cache

    keyCache.set(rawKey, {

      isValid,

      expiry: Date.now() + CACHE_TTL_MS,

    });



    // 4. Update last_used_at (async)

    if (match) {

      tx`

        UPDATE api_keys

        SET last_used_at = NOW()

        WHERE id = ${match.id}

      `.catch(err => logger.warn('AUTH', `Failed to update lastUsedAt: ${err.message}`));

    }



    return isValid;

  } catch (error) {

    logger.error('AUTH', `Validation error: ${(error as Error).message}`);

    return false;

  }

}



/**

 * Revokes an API key.

 */

export async function revokeKey(id: string, tx: Tx = sql): Promise<Result<void, Error>> {

  try {

    await tx`

      UPDATE api_keys

      SET is_active = false

      WHERE id = ${id}

    `;

    // Clear cache (brute force since we don't know which raw key it was)

    keyCache.clear(); 

    return Ok(void 0);

  } catch (error) {

    return Err(error instanceof Error ? error : new Error(String(error)));

  }

}
