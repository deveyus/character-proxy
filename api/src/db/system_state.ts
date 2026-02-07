import { sql, Tx } from './client.ts';
import { z } from 'zod';
import { Result } from 'ts-results-es';
import { wrapAsync } from '../utils/result.ts';

// --- Schemas ---

export const SystemStateSchema = z.object({
  key: z.string(),
  value: z.unknown(),
  updatedAt: z.date(),
});

export type SystemState = z.infer<typeof SystemStateSchema>;

/**
 * Persists a key-value pair to the system state table.
 * 
 * Side-Effects: Performs an UPSERT into the `system_state` table.
 * Performance: Medium -- DB Write
 * Stores the value as a JSONB object. Use sparingly for high-frequency updates.
 * 
 * @param {string} key - Unique identifier for the state entry.
 * @param {unknown} value - Data to persist (will be JSON serialized).
 * @param {Tx} [tx=sql] - Optional transaction context.
 * @returns {Promise<Result<void, Error>>} Success or database error.
 * 
 * @example
 * await setState('last_sync_time', { timestamp: Date.now() });
 */
export async function setState(key: string, value: unknown, tx: Tx = sql): Promise<Result<void, Error>> {
  return await wrapAsync(async () => {
    // deno-lint-ignore no-explicit-any
    const jsonValue = sql.json(value as any);
    await tx`
      INSERT INTO system_state (key, value, updated_at)
      VALUES (${key}, ${jsonValue}, NOW())
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = EXCLUDED.updated_at
    `;
  });
}

/**
 * Retrieves a value from the system state table.
 * 
 * Performance: Low -- DB Read
 * 
 * @template T
 * @param {string} key - Identifier for the state entry to retrieve.
 * @returns {Promise<Result<T | null, Error>>} The parsed value, null if not found, or database error.
 * 
 * @example
 * const result = await getState<{ timestamp: number }>('last_sync_time');
 * if (result.isOk() && result.value) {
 *   console.log(result.value.timestamp);
 * }
 */
export async function getState<T>(key: string): Promise<Result<T | null, Error>> {
  return await wrapAsync(async () => {
    const rows = await sql`
      SELECT value, updated_at as "updatedAt"
      FROM system_state
      WHERE key = ${key}
      LIMIT 1
    `;

    if (rows.length === 0) return null;
    
    // We don't use the full SystemStateSchema.parse here because we only need the value
    // and T might be a specific type the caller expects.
    return rows[0].value as T;
  });
}
