import { crypto } from 'std/crypto/mod.ts';
import { encodeBase64 } from 'std/encoding/base64.ts';
import { encodeHex } from 'std/encoding/hex.ts';
import { db } from '../db/client.ts';
import { apiKeys } from '../db/schema.ts';
import { and, eq } from 'drizzle-orm';
import { Err, Ok, Result } from 'ts-results-es';
import { logger } from '../utils/logger.ts';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const keyCache = new Map<string, { isValid: boolean; expiry: number }>();

/**
 * Hashes a raw API key using SHA3-512 for quantum resistance.
 */
export async function hashKey(rawKey: string): Promise<string> {
  const data = new TextEncoder().encode(rawKey);
  const hashBuffer = await crypto.subtle.digest('SHA3-512', data);
  return encodeHex(hashBuffer);
}

/**
 * Generates a new unique API key using SHAKE256.
 * Returns the raw key (to be shown once to the user) and its hash (for storage).
 */
export async function generateNewKey(name: string): Promise<Result<{ rawKey: string; id: string }, Error>> {
  try {
    // 1. Generate 32 bytes of high-entropy random data
    const entropy = crypto.getRandomValues(new Uint8Array(32));
    
    // 2. Pass through SHAKE256 to derive the 64-byte key
    const derivedBuffer = await crypto.subtle.digest('SHAKE256', entropy);
    const rawKey = `cp_${encodeBase64(derivedBuffer).replace(/[+/=]/g, '').substring(0, 48)}`;
    
    // 3. Hash for storage
    const keyHash = await hashKey(rawKey);
    const keyPrefix = rawKey.substring(0, 8);

    // 4. Store in DB
    const [inserted] = await db.insert(apiKeys).values({
      name,
      keyHash,
      keyPrefix,
    }).returning({ id: apiKeys.id });

    return Ok({ rawKey, id: inserted.id });
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Validates an incoming API key.
 */
export async function validateKey(rawKey: string): Promise<boolean> {
  if (!rawKey) return false;

  // 1. Check in-memory cache
  const cached = keyCache.get(rawKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.isValid;
  }

  try {
    // 2. Hash and lookup
    const keyHash = await hashKey(rawKey);
    const [match] = await db.select().from(apiKeys)
      .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.isActive, true)))
      .limit(1);

    const isValid = !!match;

    // 3. Update cache
    keyCache.set(rawKey, {
      isValid,
      expiry: Date.now() + CACHE_TTL_MS,
    });

    // 4. Update last_used_at (async)
    if (match) {
      db.update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, match.id))
        .catch(err => logger.warn('AUTH', `Failed to update lastUsedAt: ${err.message}`));
    }

    return isValid;
  } catch (error) {
    logger.error('AUTH', `Validation error: ${error.message}`);
    return false;
  }
}

/**
 * Revokes an API key.
 */
export async function revokeKey(id: string): Promise<Result<void, Error>> {
  try {
    await db.update(apiKeys).set({ isActive: false }).where(eq(apiKeys.id, id));
    // Clear cache (brute force since we don't know which raw key it was)
    keyCache.clear(); 
    return Ok(void 0);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}
