import { db } from './client.ts';
import { systemState } from './schema.ts';
import { eq } from 'drizzle-orm';
import { Result } from 'ts-results-es';
import { wrapAsync } from '../utils/result.ts';

/**
 * Persists a key-value pair to the system state table.
 * The value is stored as JSONB.
 */
export async function setState(key: string, value: unknown): Promise<Result<void, Error>> {
  return await wrapAsync(async () => {
    await db.insert(systemState)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: systemState.key,
        set: { value, updatedAt: new Date() },
      });
  });
}

/**
 * Retrieves a value from the system state table.
 */
export async function getState<T>(key: string): Promise<Result<T | null, Error>> {
  return await wrapAsync(async () => {
    const [row] = await db.select().from(systemState).where(eq(systemState.key, key)).limit(1);
    if (!row) return null;
    // deno-lint-ignore no-explicit-any
    return row.value as any as T;
  });
}