import { logger } from '../../utils/logger.ts';
import * as characterService from '../character.ts';
import * as corporationService from '../corporation.ts';
import * as allianceService from '../alliance.ts';
import { getNextPendingItem, markAsCompleted, markAsFailed, markAsProcessing } from './queue.ts';
import { Ok, Result } from 'ts-results-es';

/**
 * Processes a single item from the queue.
 */
export async function processQueueItem(): Promise<Result<boolean, Error>> {
  try {
    const item = await getNextPendingItem();
    if (!item) return Ok(false);

    await markAsProcessing(item.entityId, item.entityType as any);
    logger.debug('SYSTEM', `Processing discovery: ${item.entityType} ${item.entityId}`);

    let result;
    if (item.entityType === 'character') {
      result = await characterService.getById(item.entityId, undefined, 'background');
    } else if (item.entityType === 'corporation') {
      result = await corporationService.getById(item.entityId, undefined, 'background');
    } else {
      result = await allianceService.getById(item.entityId, undefined, 'background');
    }

    if (result.isErr()) {
      await markAsFailed(item.entityId, item.entityType as any, item.attempts);
      return result;
    }

    await markAsCompleted(item.entityId, item.entityType as any);
    return Ok(true);
  } catch (error) {
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
    
    if (result.isOk() && result.value === false) {
      // No items, sleep for a bit
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else if (result.isErr()) {
      // Error occurred, wait a bit before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      // Processed an item, small delay to avoid hammering
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}
