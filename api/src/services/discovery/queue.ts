import { db } from '../../db/client.ts';
import { discoveryQueue } from '../../db/schema.ts';
import { and, eq, sql } from 'drizzle-orm';
import { Err, Ok, Result } from 'ts-results-es';

export type EntityType = 'character' | 'corporation' | 'alliance';

const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Adds an entity to the discovery queue.
 */
export async function addToQueue(
  entityId: number,
  entityType: EntityType,
): Promise<Result<void, Error>> {
  try {
    await db.insert(discoveryQueue).values({
      entityId,
      entityType,
    }).onConflictDoNothing();
    return Ok(void 0);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Atomic claim of a task from the queue.
 * Finds one item that is not locked, locks it, and returns it.
 * Prioritizes based on: (Age * (AccessCount + 1))
 */
export async function claimTask() {
  const now = new Date();

  return await db.transaction(async (tx) => {
    // We use a raw SQL fragment for the complex join/ordering to keep it efficient
    const [item] = await tx.execute(sql`
      SELECT q.* 
      FROM discovery_queue q
      LEFT JOIN character_static char ON q.entity_id = char.character_id AND q.entity_type = 'character'
      LEFT JOIN corporation_static corp ON q.entity_id = corp.corporation_id AND q.entity_type = 'corporation'
      LEFT JOIN alliance_static alli ON q.entity_id = alli.alliance_id AND q.entity_type = 'alliance'
      WHERE (q.locked_until IS NULL OR q.locked_until < ${now})
      ORDER BY (
        EXTRACT(EPOCH FROM (${now} - COALESCE(char.last_modified_at, corp.last_modified_at, alli.last_modified_at, q.created_at))) * 
        (COALESCE(char.access_count, corp.access_count, alli.access_count, 0) + 1)
      ) DESC
      LIMIT 1
      FOR UPDATE OF q SKIP LOCKED
    `);

    if (!item) return null;

    const entityType = item.entity_type as EntityType;
    const entityId = item.entity_id as number;

    const lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
    await tx.update(discoveryQueue)
      .set({ lockedUntil, updatedAt: now })
      .where(and(
        eq(discoveryQueue.entityId, entityId),
        eq(discoveryQueue.entityType, entityType),
      ));

    return {
      entityId,
      entityType,
      attempts: item.attempts as number,
      lockedUntil,
    };
  });
}

/**
 * Deletes a completed item from the queue.
 */
export async function markAsCompleted(entityId: number, entityType: EntityType): Promise<void> {
  await db.delete(discoveryQueue)
    .where(and(eq(discoveryQueue.entityId, entityId), eq(discoveryQueue.entityType, entityType)));
}

/**
 * Releases a failed task back to the queue.
 */
export async function markAsFailed(
  entityId: number,
  entityType: EntityType,
  currentAttempts: number,
): Promise<void> {
  await db.update(discoveryQueue)
    .set({
      lockedUntil: null,
      attempts: currentAttempts + 1,
      updatedAt: new Date(),
    })
    .where(and(eq(discoveryQueue.entityId, entityId), eq(discoveryQueue.entityType, entityType)));
}
