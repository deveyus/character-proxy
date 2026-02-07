import { sql } from '../../db/client.ts';
import { logger } from '../../utils/logger.ts';
import { addToQueue } from './queue.ts';

/**
 * Periodically identifies entities that have exceeded the freshness threshold and re-queues them.
 *
 * Logic:
 * 1. Scans `character_static`, `corporation_static`, and `alliance_static`.
 * 2. Filters for entities where the intelligent urgency formula returns > 1.0.
 * 3. Adds selected IDs back to the `discovery_queue`.
 *
 * Performance: Medium -- DB Scan
 * Executes full scans over the `static` entity tables. Limit 100 per cycle.
 *
 * Side-Effects: Triggers `addToQueue` for discovered stale IDs.
 */
export async function requeueStaleEntities() {
  logger.info('SYSTEM', 'Maintenance: Checking for stale entities to re-queue...');

  // Identify entities that are NOT currently in the queue but are "stale"
  // Formula: (Now - last_discovery_at) * (access_count + 1)

  const now = new Date();

  // We look for items where Urgency > 1.0 (baseline 24 hours)
  // Formula: (Age / 86400)^2 * log10(AccessCount + 10)

  const staleCharacters = await sql`
    SELECT character_id as id
    FROM character_static
    WHERE (last_discovery_at IS NULL OR (POWER(EXTRACT(EPOCH FROM (${now} - last_discovery_at)) / 86400, 2) * LOG(access_count + 10)) > 1.0)
    LIMIT 100
  `;

  for (const row of staleCharacters) {
    await addToQueue(Number(row.id), 'character');
  }

  const staleCorps = await sql`
    SELECT corporation_id as id
    FROM corporation_static
    WHERE (last_discovery_at IS NULL OR (POWER(EXTRACT(EPOCH FROM (${now} - last_discovery_at)) / 86400, 2) * LOG(access_count + 10)) > 1.0)
    LIMIT 100
  `;

  for (const row of staleCorps) {
    await addToQueue(Number(row.id), 'corporation');
  }

  const staleAlliances = await sql`
    SELECT alliance_id as id
    FROM alliance_static
    WHERE (last_discovery_at IS NULL OR (POWER(EXTRACT(EPOCH FROM (${now} - last_discovery_at)) / 86400, 2) * LOG(access_count + 10)) > 1.0)
    LIMIT 100
  `;

  for (const row of staleAlliances) {
    await addToQueue(Number(row.id), 'alliance');
  }

  logger.info('SYSTEM', 'Maintenance: Re-queue check complete.');
}

/**
 * Starts the long-running maintenance worker loop.
 *
 * Runs every hour by default.
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
