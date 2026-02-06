import { logger } from '../../utils/logger.ts';
import * as characterService from '../character.ts';
import * as corporationService from '../corporation.ts';
import * as allianceService from '../alliance.ts';
import { claimTask, markAsCompleted, markAsFailed } from './queue.ts';
import { Err, Ok, Result } from 'ts-results-es';
import { getApiHealth } from '../../clients/esi_limiter.ts';
import { db } from '../../db/client.ts';
import { discoveryQueue } from '../../db/schema.ts';
import { and, eq } from 'drizzle-orm';

export type EntityType = 'character' | 'corporation' | 'alliance';

const MAX_ATTEMPTS = 5;

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
      return Err(new Error(`Unknown entity type: ${entityType}`));
    }

    if (result.isErr()) {
      const error = result.error;
      // Handle ESI specific error types if available (from fetchEntity results)
      // Note: result comes from Service, which wraps ESIResponse.
      // We might need to inspect the error message or enrich the service return.
      // But for now, let's use the error message pattern or check if we can get the type.

      const isNotFound = error.message.includes('404') || error.message.includes('not found');
      const isTransient = error.message.includes('Rate limit') || error.message.includes('500') ||
        error.message.includes('503');

      if (isNotFound) {
        logger.warn(
          'SYSTEM',
          `Dead end discovery (404): ${entityType} ${item.entityId}. Deleting.`,
        );
        await markAsCompleted(item.entityId, entityType); // Deleting is done via markAsCompleted
        return Ok(true);
      }

      if (isTransient) {
        logger.debug(
          'SYSTEM',
          `Transient error for ${entityType} ${item.entityId}. Releasing lock.`,
        );
        await db.update(discoveryQueue)
          .set({ lockedUntil: null })
          .where(
            and(
              eq(discoveryQueue.entityId, item.entityId),
              eq(discoveryQueue.entityType, entityType),
            ),
          );
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

  while (true) {
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
