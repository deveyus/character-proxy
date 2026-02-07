import { sql } from '../../db/client.ts';
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
    await sql`
      INSERT INTO discovery_queue (entity_id, entity_type)
      VALUES (${entityId}, ${entityType})
      ON CONFLICT (entity_id, entity_type) DO NOTHING
    `;
    return Ok(void 0);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`DEBUG: addToQueue failed for ${entityType} ${entityId}:`, err);
    return Err(err);
  }
}

/**
 * Atomic claim of a task from the queue.
 * Finds one item that is not locked, locks it, and returns it.
 * Prioritizes based on: (Age * (AccessCount + 1))
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
 * Returns the number of items currently in the queue.
 */
export async function getQueueDepth(): Promise<number> {
  const rows = await sql`SELECT COUNT(*) as count FROM discovery_queue`;
  return Number(rows[0].count);
}

/**
 * Deletes a completed item from the queue.
 */
export async function markAsCompleted(entityId: number, entityType: EntityType): Promise<void> {
  await sql`
    DELETE FROM discovery_queue
    WHERE entity_id = ${entityId} AND entity_type = ${entityType}
  `;
}

/**
 * Releases a failed task back to the queue.
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