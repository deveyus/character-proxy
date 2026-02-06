import { db } from './client.ts';
import { systemState } from './schema.ts';
import { eq } from 'drizzle-orm';
import { Err, Ok, Result } from 'ts-results-es';

/**
 * Persists a key-value pair to the system state table.
 */
export async function setState(key: string, value: unknown): Promise<Result<void, Error>> {
  try {
    await db.insert(systemState)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: systemState.key,
        set: { value, updatedAt: new Date() },
      });
    return Ok(void 0);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Retrieves a value from the system state table.
 */
export async function getState<T>(key: string): Promise<Result<T | null, Error>> {
  try {
    const [row] = await db.select().from(systemState).where(eq(systemState.key, key)).limit(1);
    if (!row) return Ok(null);
    return Ok(row.value as T);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}
