import { logger } from '../../utils/logger.ts';
import * as characterService from '../character.ts';
import * as corporationService from '../corporation.ts';
import * as allianceService from '../alliance.ts';
import { claimTask, markAsCompleted, markAsFailed } from './queue.ts';
import { Ok, Result } from 'ts-results-es';
import { getApiHealth } from '../../clients/esi_limiter.ts';
import { sql } from '../../db/client.ts';

import { metrics } from '../../utils/metrics.ts';
import { setState } from '../../db/system_state.ts';

export type EntityType = 'character' | 'corporation' | 'alliance';

const MAX_ATTEMPTS = 5;
const HEARTBEAT_INTERVAL_MS = 60 * 1000;

/**
 * Processes a single item from the queue.
 */
export async function processQueueItem(): Promise<Result<boolean, Error>> {
  try {
    if (getApiHealth() === 'down') {
      return Ok(false);
    }

    const item = await claimTask();
    if (!item) return Ok(false);

    const entityType = item.entityType as EntityType;

    logger.debug('SYSTEM', `Processing discovery: ${entityType} ${item.entityId}`);

    let result;
    if (entityType === 'character') {
      result = await characterService.getById(item.entityId, undefined, 'background');
    }
    if (entityType === 'corporation') {
      result = await corporationService.getById(item.entityId, undefined, 'background');
    }
    if (entityType === 'alliance') {
      result = await allianceService.getById(item.entityId, undefined, 'background');
    }

    if (!result) {
      return Ok(false); // Should not happen with type safety
    }

    if (result.isErr()) {
      const error = result.error;
      const isNotFound = error.message.includes('404') || error.message.includes('not found');
      const isTransient = error.message.includes('Rate limit') || error.message.includes('500') ||
        error.message.includes('503');

      if (isNotFound) {
        logger.warn(
          'SYSTEM',
          `Dead end discovery (404): ${entityType} ${item.entityId}. Deleting.`,
        );
        await markAsCompleted(item.entityId, entityType);
        return Ok(true);
      }

      if (isTransient) {
        logger.debug(
          'SYSTEM',
          `Transient error for ${entityType} ${item.entityId}. Releasing lock.`,
        );
        await sql`
          UPDATE discovery_queue
          SET locked_until = NULL
          WHERE entity_id = ${item.entityId} AND entity_type = ${entityType}
        `;
        return Ok(false);
      }

      if (item.attempts >= MAX_ATTEMPTS) {
        logger.error(
          'SYSTEM',
          `Poison pill detected: ${entityType} ${item.entityId} failed ${item.attempts} times. Deleting.`,
        );
        await markAsCompleted(item.entityId, entityType);
        return Ok(true);
      }

      await markAsFailed(item.entityId, entityType, item.attempts);
      return result;
    }

    await markAsCompleted(item.entityId, entityType);
    metrics.inc('discovery_queue_processed_total');
    return Ok(true);
  } catch (_error) {
    return Ok(false); // Silent error for loop
  }
}

/**
 * Background loop for processing the discovery queue.
 */
export async function startDiscoveryWorker(workerId = 0) {
  logger.info('SYSTEM', `Discovery worker ${workerId} started.`);

  let lastHeartbeat = 0;

  while (true) {
    // Send heartbeat
    if (Date.now() - lastHeartbeat > HEARTBEAT_INTERVAL_MS) {
      await setState(`heartbeat_worker_${workerId}`, {
        last_seen: new Date(),
        status: 'running',
      }).catch((err) =>
        logger.warn('SYSTEM', `Failed to send heartbeat for worker ${workerId}: ${err.message}`)
      );
      lastHeartbeat = Date.now();
    }

    const result = await processQueueItem();

    if (result.isErr()) {
      // Error occurred, wait a bit before retry
      await new Promise((resolve) => setTimeout(resolve, 1000));
      continue;
    }

    if (result.value === false) {
      // No items, sleep for a bit
      await new Promise((resolve) => setTimeout(resolve, 5000));
      continue;
    }

    // Processed an item, small delay to avoid hammering
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}