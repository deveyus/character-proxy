import { logger } from '../../utils/logger.ts';
import * as characterService from '../character.ts';
import * as corporationService from '../corporation.ts';
import * as allianceService from '../alliance.ts';
import { getNextPendingItem, markAsCompleted, markAsFailed, markAsProcessing } from './queue.ts';
import { Err, Ok, Result } from 'ts-results-es';
import { getApiHealth } from '../../clients/esi_limiter.ts';

export type EntityType = 'character' | 'corporation' | 'alliance';

/**
 * Processes a single item from the queue.
 */
export async function processQueueItem(): Promise<Result<boolean, Error>> {
  try {
    if (getApiHealth() === 'down') {
      return Ok(false);
    }

    const item = await getNextPendingItem();
    if (!item) return Ok(false);

    const entityType = item.entityType as EntityType;

    await markAsProcessing(item.entityId, entityType);
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

    if (!result || result.isErr()) {
      await markAsFailed(item.entityId, entityType, item.attempts);
      return result || Err(new Error(`Unknown entity type: ${entityType}`));
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
export async function startDiscoveryWorker() {
  logger.info('SYSTEM', 'Starting discovery worker...');

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
