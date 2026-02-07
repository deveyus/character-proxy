import { sql } from './client.ts';
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
 * The value is stored as JSONB.
 */
export async function setState(key: string, value: unknown): Promise<Result<void, Error>> {
  return await wrapAsync(async () => {
    await sql`
      INSERT INTO system_state (key, value, updated_at)
      VALUES (${key}, ${sql.json(value)}, NOW())
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = EXCLUDED.updated_at
    `;
  });
}

/**
 * Retrieves a value from the system state table.
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
