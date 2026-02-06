import { db } from '../../db/client.ts';
import { sql } from 'drizzle-orm';
import { logger } from '../../utils/logger.ts';
import { addToQueue } from './queue.ts';

/**
 * Periodically scans static tables and re-queues entities that need a refresh
 * based on their age and access frequency.
 */
export async function requeueStaleEntities() {
  logger.info('SYSTEM', 'Maintenance: Checking for stale entities to re-queue...');

  // Identify entities that are NOT currently in the queue but are "stale"
  // Formula: (Now - last_discovery_at) * (access_count + 1)

  const now = new Date();

  // We look for items where (Now - lastDiscoveryAt) * (accessCount + 1) > 86400
  // AND they are not currently in the queue (lockedUntil is null or in the past)
  // Actually, simplest check: entities where lastDiscoveryAt is null OR very old.

  const staleCharacters = await db.execute(sql`
    SELECT character_id as id
    FROM character_static
    WHERE (last_discovery_at IS NULL OR (EXTRACT(EPOCH FROM (${now} - last_discovery_at)) * (access_count + 1)) > 86400)
    LIMIT 100
  `);

  for (const row of staleCharacters) {
    await addToQueue(row.id as number, 'character');
  }

  const staleCorps = await db.execute(sql`
    SELECT corporation_id as id
    FROM corporation_static
    WHERE (last_discovery_at IS NULL OR (EXTRACT(EPOCH FROM (${now} - last_discovery_at)) * (access_count + 1)) > 86400)
    LIMIT 100
  `);

  for (const row of staleCorps) {
    await addToQueue(row.id as number, 'corporation');
  }

  const staleAlliances = await db.execute(sql`
    SELECT alliance_id as id
    FROM alliance_static
    WHERE (last_discovery_at IS NULL OR (EXTRACT(EPOCH FROM (${now} - last_discovery_at)) * (access_count + 1)) > 86400)
    LIMIT 100
  `);

  for (const row of staleAlliances) {
    await addToQueue(row.id as number, 'alliance');
  }

  logger.info('SYSTEM', 'Maintenance: Re-queue check complete.');
}
/**
 * Starts the maintenance loop.
 */
export async function startMaintenanceWorker() {
  while (true) {
    try {
      await requeueStaleEntities();
    } catch (err) {
      logger.error('SYSTEM', 'Maintenance worker failed', { error: err });
    }
    // Run every hour
    await new Promise((resolve) => setTimeout(resolve, 60 * 60 * 1000));
  }
}
