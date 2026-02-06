import { db } from '../../db/client.ts';
import { discoveryQueue } from '../../db/schema.ts';
import { and, eq } from 'drizzle-orm';
import { Err, Ok, Result } from 'ts-results-es';

export type EntityType = 'character' | 'corporation' | 'alliance';

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
      status: 'pending',
    }).onConflictDoNothing();
    return Ok(void 0);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Gets the next pending item from the queue.
 */
export async function getNextPendingItem() {
  const [item] = await db.select().from(discoveryQueue)
    .where(eq(discoveryQueue.status, 'pending'))
    .limit(1);
  return item;
}

/**
 * Updates an item's status in the queue.
 */
export async function updateQueueStatus(
  entityId: number,
  entityType: EntityType,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  attemptsInc = 0,
): Promise<void> {
  await db.update(discoveryQueue)
    .set({ 
      status, 
      updatedAt: new Date(),
      attempts: attemptsInc > 0 ? (sql => sql`attempts + ${attemptsInc}`) : undefined 
    } as any) // Drizzle sql tag sometimes tricky in simple set
    .where(and(eq(discoveryQueue.entityId, entityId), eq(discoveryQueue.entityType, entityType)));
}

/**
 * Specialized update for processing state.
 */
export async function markAsProcessing(entityId: number, entityType: EntityType): Promise<void> {
    await db.update(discoveryQueue)
      .set({ status: 'processing', updatedAt: new Date() })
      .where(and(eq(discoveryQueue.entityId, entityId), eq(discoveryQueue.entityType, entityType)));
}

/**
 * Specialized update for completed state.
 */
export async function markAsCompleted(entityId: number, entityType: EntityType): Promise<void> {
    await db.update(discoveryQueue)
      .set({ status: 'completed', updatedAt: new Date() })
      .where(and(eq(discoveryQueue.entityId, entityId), eq(discoveryQueue.entityType, entityType)));
}

/**
 * Specialized update for failed state.
 */
export async function markAsFailed(entityId: number, entityType: EntityType, currentAttempts: number): Promise<void> {
    await db.update(discoveryQueue)
      .set({ 
        status: 'failed', 
        attempts: currentAttempts + 1, 
        updatedAt: new Date() 
      })
      .where(and(eq(discoveryQueue.entityId, entityId), eq(discoveryQueue.entityType, entityType)));
}
