import { db as defaultDb } from '../client.ts';
import { Err, Ok, Result } from 'ts-results-es';
import * as corporationService from '../../services/corporation.ts';
import { logger } from '../../utils/logger.ts';

const ESI_BASE_URL = 'https://esi.evetech.net/latest';
const HYDRATION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

/**
 * Hydrates the database with NPC corporations from ESI.
 * Now uses the service layer to ensure consistent ledger and cache management.
 */
export async function hydrateNpcCorporations(_db: typeof defaultDb): Promise<Result<void, Error>> {
  try {
    logger.info('SYSTEM', 'Hydrating NPC corporations...');

    const response = await fetch(`${ESI_BASE_URL}/corporations/npccorps/`);
    if (!response.ok) {
      return Err(new Error(`Failed to fetch NPC corps list: ${response.statusText}`));
    }

    const npcCorpIds: number[] = await response.json();
    logger.info('SYSTEM', `Found ${npcCorpIds.length} NPC corporations.`);

    // Fetch each corp using the service.
    // The service handles E-Tags, Expiry, and Ledger updates automatically.
    for (const corpId of npcCorpIds) {
      const result = await corporationService.getById(corpId, HYDRATION_MAX_AGE, 'background');
      if (result.isErr()) {
        logger.warn('SYSTEM', `Failed to hydrate NPC corp ${corpId}: ${result.error.message}`);
        continue;
      }
    }

    logger.info('SYSTEM', 'NPC corporation hydration complete.');
    return Ok(void 0);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}
