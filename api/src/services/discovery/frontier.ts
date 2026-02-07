import { fetchEntity } from '../../clients/esi.ts';
import { getState, setState } from '../../db/system_state.ts';
import { logger } from '../../utils/logger.ts';

// Initial ranges based on 2024/2025 EVE ID space
const CHAR_MIN = 2112000000;
const CHAR_MAX = 2125000000; // Future buffer
const CORP_MIN = 98000000;
const CORP_MAX = 105000000; // Future buffer

/**
 * Binary search to find the High Water Mark (HWM) of an entity ID space.
 */
async function binarySearchHWM(
  pathPrefix: string,
  min: number,
  max: number,
): Promise<number> {
  let low = min;
  let high = max;
  let hwm = min;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const res = await fetchEntity(`${pathPrefix}${mid}/`, null, 'background');

    if (res.status === 'error' && res.type === 'not_found') {
      // Too high, search lower
      high = mid - 1;
    } else {
      // Found one, or some other error (forbidden/server) which suggests it exists
      hwm = mid;
      low = mid + 1;
    }
    
    // Polite delay to avoid hammering ESI during binary search
    await new Promise(r => setTimeout(r, 100));
  }

  return hwm;
}

/**
 * Scans for the High Water Mark of characters and corporations.
 */
export async function refreshFrontierHWM() {
  logger.info('SYSTEM', 'Refreshing Frontier HWM...');

  // 1. Character HWM
  const charHwm = await binarySearchHWM('/characters/', CHAR_MIN, CHAR_MAX);
  await setState('character_hwm', { version: charHwm });
  logger.info('SYSTEM', `Character HWM found: ${charHwm}`);

  // 2. Corporation HWM
  const corpHwm = await binarySearchHWM('/corporations/', CORP_MIN, CORP_MAX);
  await setState('corporation_hwm', { version: corpHwm });
  logger.info('SYSTEM', `Corporation HWM found: ${corpHwm}`);
}

/**
 * Returns the current HWM from system state.
 */
export async function getHWM(type: 'character' | 'corporation'): Promise<number> {
  const key = `${type}_hwm`;
  const state = await getState<{ version: number }>(key);
  if (state.isErr() || !state.value) return type === 'character' ? CHAR_MIN : CORP_MIN;
  return state.value.version;
}
