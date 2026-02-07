import { findEntityGaps } from '../../db/utils.ts';
import { getHWM } from './frontier.ts';
import { addToQueue, getQueueDepth } from './queue.ts';
import { getState, setState } from '../../db/system_state.ts';
import { logger } from '../../utils/logger.ts';

const PROBE_BLOCK_SIZE = 1000;
const ESI_BASE_URL = 'https://esi.evetech.net/latest';

/**
 * Validates a list of EVE IDs using the bulk name lookup endpoint.
 * 
 * Performance: High -- ESI (Bulk Probe)
 * ESI: /universe/names/
 * 
 * @param {number[]} ids - List of up to 1000 IDs to probe.
 * @returns {Promise<number[]>} The subset of IDs that correspond to valid discoverable entities.
 */
async function probeIds(ids: number[]): Promise<number[]> {
  if (ids.length === 0) return [];

  try {
    const response = await fetch(`${ESI_BASE_URL}/universe/names/`, {
      method: 'POST',
      body: JSON.stringify(ids),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      logger.warn('ESI', `Bulk probe failed: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json() as Array<{ id: number, category: string }>;
    // We only care about characters, corporations, and alliances for now
    return data
      .filter(item => ['character', 'corporation', 'alliance'].includes(item.category))
      .map(item => item.id);
  } catch (err) {
    logger.error('ESI', 'Bulk probe exception', { error: err });
    return [];
  }
}

/**
 * Executes a single step of the proactive prober.
 * 
 * Logic:
 * 1. Checks `getQueueDepth()`. Yields if the discovery queue is active.
 * 2. Attempts to find internal gaps in the character static table.
 * 3. If no internal gaps, continues forward from the last known frontier ID.
 * 4. Queues any discovered valid IDs.
 * 
 * Performance: High -- ESI (Bulk Probe)
 * Side-Effects: Triggers `addToQueue` for discovered IDs.
 */
export async function runProberStep() {
  const depth = await getQueueDepth();
  if (depth > 0) return; // Only run when idle

  // --- 1. Handle Internal Gaps ---
  const charGaps = await findEntityGaps('character');
  if (charGaps.isOk() && charGaps.value.length > 0) {
    const gap = charGaps.value[0];
    const targetIds = [];
    for (let i = 0; i < PROBE_BLOCK_SIZE && (gap.startId + i) <= gap.endId; i++) {
      targetIds.push(gap.startId + i);
    }
    
    logger.info('SYSTEM', `Probing internal gap: ${targetIds[0]} to ${targetIds[targetIds.length-1]}`);
    const validIds = await probeIds(targetIds);
    for (const id of validIds) {
      // We don't know the type from /universe/names/ without extra checking, 
      // but addToQueue handles collisions and the worker will resolve the actual type.
      // For now, we assume it's the type of the table we found the gap in.
      await addToQueue(id, 'character');
    }
    return;
  }

  // --- 2. Handle Frontier (Brute Force forward) ---
  const lastIdState = await getState<{ last_id: number }>('prober_last_frontier_id');
  const currentId = lastIdState.isOk() && lastIdState.value ? lastIdState.value.last_id : 2112000000;
  
  const hwm = await getHWM('character');
  if (currentId < hwm) {
    const targetIds = [];
    for (let i = 1; i <= PROBE_BLOCK_SIZE && (currentId + i) <= hwm; i++) {
      targetIds.push(currentId + i);
    }

    logger.info('SYSTEM', `Probing frontier: ${targetIds[0]} to ${targetIds[targetIds.length-1]}`);
    const validIds = await probeIds(targetIds);
    for (const id of validIds) {
      await addToQueue(id, 'character');
    }

    const newLastId = targetIds[targetIds.length - 1];
    await setState('prober_last_frontier_id', { last_id: newLastId });
  }
}

/**
 * Starts the proactive Gap Prober background loop.
 */
export async function startProber() {
  logger.info('SYSTEM', 'Gap Prober started.');
  while (true) {
    try {
      await runProberStep();
    } catch (err) {
      logger.error('SYSTEM', 'Prober step failed', { error: err });
    }
    // Polite wait between steps
    await new Promise(r => setTimeout(r, 10000)); 
  }
}