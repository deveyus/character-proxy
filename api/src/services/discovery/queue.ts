import { sql } from '../../db/client.ts';
import { Err, Ok, Result } from 'ts-results-es';
import { emitDiscoveryEvent } from './extraction.ts';

/**
 * Supported entity types for the discovery queue.
 */
export type EntityType = 'character' | 'corporation' | 'alliance';

/**
 * Standard duration for which a claimed task remains locked.
 */
const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Adds an entity to the discovery queue for eventual crawling.
 *
 * Side-Effects: Performs a database INSERT into `discovery_queue` with
 * ON CONFLICT DO NOTHING. Emits a `queue_updated` event on success.
 *
 * @param {number} entityId - The EVE ID of the target entity.
 * @param {EntityType} entityType - The category of the entity.
 * @returns {Promise<Result<void, Error>>} Success or database error.
 */
export async function addToQueue(
  entityId: number,
  entityType: EntityType,
): Promise<Result<void, Error>> {
  try {
    const res = await sql`
      INSERT INTO discovery_queue (entity_id, entity_type)
      VALUES (${entityId}, ${entityType})
      ON CONFLICT (entity_id, entity_type) DO NOTHING
    `;

    // Only emit if a row was actually inserted
    if (res.count > 0) {
      emitDiscoveryEvent('queue_updated', entityId);
    }

    return Ok(void 0);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`DEBUG: addToQueue failed for ${entityType} ${entityId}:`, err);
    return Err(err);
  }
}

/**
 * Performs an atomic claim of the most urgent pending task from the queue.
 *
 * Logic:
 * 1. Finds one unlocked item or item with an expired lock.
 * 2. Joins with static tables to calculate urgency based on the intelligent priority formula.
 * 3. Uses `SKIP LOCKED` to allow multiple concurrent workers without contention.
 * 4. Atomically updates the `locked_until` timestamp.
 *
 * Performance: Medium -- DB Order By
 * Executes a complex join and calculation over the active queue.
 *
 * @returns {Promise<Object | null>} The claimed task data or null if the queue is empty.
 */
export async function claimTask() {
  const now = new Date();

  // deno-lint-ignore no-explicit-any
  return await sql.begin(async (tx: any) => {
    // We use a raw SQL fragment for the complex join/ordering to keep it efficient
    const rows = await tx`
      SELECT q.* 
      FROM discovery_queue q
      LEFT JOIN character_static char ON q.entity_id = char.character_id AND q.entity_type = 'character'
      LEFT JOIN corporation_static corp ON q.entity_id = corp.corporation_id AND q.entity_type = 'corporation'
      LEFT JOIN alliance_static alli ON q.entity_id = alli.alliance_id AND q.entity_type = 'alliance'
      WHERE (q.locked_until IS NULL OR q.locked_until < ${now})
      ORDER BY (
        POWER(EXTRACT(EPOCH FROM (${now} - COALESCE(char.last_modified_at, corp.last_modified_at, alli.last_modified_at, q.created_at))) / 86400, 2) * 
        LOG(COALESCE(char.access_count, corp.access_count, alli.access_count, 0) + 10)
      ) DESC
      LIMIT 1
      FOR UPDATE OF q SKIP LOCKED
    `;

    if (rows.length === 0) return null;
    const item = rows[0];

    const entityType = item.entity_type as EntityType;
    const entityId = Number(item.entity_id);

    const lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
    await tx`
      UPDATE discovery_queue
      SET locked_until = ${lockedUntil}, updated_at = NOW()
      WHERE entity_id = ${entityId} AND entity_type = ${entityType}
    `;

    return {
      entityId,
      entityType,
      attempts: Number(item.attempts),
      lockedUntil,
    };
  });
}

/**
 * Returns the total number of tasks currently residing in the queue.
 *
 * Performance: Low -- DB Count
 *
 * @returns {Promise<number>} Total count of queue entries.
 */
export async function getQueueDepth(): Promise<number> {
  const rows = await sql`SELECT COUNT(*) as count FROM discovery_queue`;
  return Number(rows[0].count);
}

/**
 * Removes a task from the queue upon successful processing.
 *
 * Side-Effects: Performs a database DELETE on `discovery_queue`.
 *
 * @param {number} entityId - Target entity EVE ID.
 * @param {EntityType} entityType - Target entity category.
 */
export async function markAsCompleted(entityId: number, entityType: EntityType): Promise<void> {
  await sql`
    DELETE FROM discovery_queue
    WHERE entity_id = ${entityId} AND entity_type = ${entityType}
  `;
}

/**
 * Releases a failed task back into the queue for future retry.
 *
 * Side-Effects: Performs a database UPDATE, incrementing the attempt counter
 * and clearing the lock.
 *
 * @param {number} entityId - Target entity EVE ID.
 * @param {EntityType} entityType - Target entity category.
 * @param {number} currentAttempts - Current failure count for this task.
 */
export async function markAsFailed(
  entityId: number,
  entityType: EntityType,
  currentAttempts: number,
): Promise<void> {
  await sql`
    UPDATE discovery_queue
    SET locked_until = NULL, attempts = ${currentAttempts + 1}, updated_at = NOW()
    WHERE entity_id = ${entityId} AND entity_type = ${entityType}
  `;
}
