import { addToQueue } from './queue.ts';
import {
  getAllianceMembers,
  getCharacterCorpHistory,
  getCorpAllianceHistory,
} from '../../clients/esi.ts';
import { parseBioLinks } from '../../utils/bio_parser.ts';
import { sql } from '../../db/client.ts';
import {
  ESIAllianceHistorySchema,
  ESIAllianceMembersSchema,
  ESIAllianceSchema,
  ESICharacterSchema,
  ESICorpHistorySchema,
  ESICorporationSchema,
} from '../../clients/esi_schemas.ts';
import { logger } from '../../utils/logger.ts';

/**
 * Valid event types for notifying completion of entity discovery steps.
 */
export type DiscoveryEvent = 'character_extracted' | 'corporation_extracted' | 'alliance_extracted';

/**
 * Signature for discovery event callbacks.
 */
type DiscoveryCallback = (id: number) => void;

const listeners = new Map<DiscoveryEvent, Set<DiscoveryCallback>>();

/**
 * Registers a listener for discovery completion events.
 * Useful for test synchronization or internal monitoring.
 *
 * @param {DiscoveryEvent} event - The event to listen for.
 * @param {DiscoveryCallback} cb - The callback function to execute.
 */
export function onDiscoveryEvent(event: DiscoveryEvent, cb: DiscoveryCallback) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(cb);
}

/**
 * Unregisters a previously registered discovery event listener.
 *
 * @param {DiscoveryEvent} event - Target event.
 * @param {DiscoveryCallback} cb - Target callback.
 */
export function offDiscoveryEvent(event: DiscoveryEvent, cb: DiscoveryCallback) {
  listeners.get(event)?.delete(cb);
}

/**
 * Internal helper to broadcast discovery completion.
 */
function emit(event: DiscoveryEvent, id: number) {
  listeners.get(event)?.forEach((cb) => cb(id));
}

/**
 * Analyzes a Character and queues all newly discovered related entities.
 *
 * Side-Effects:
 * - Triggers `addToQueue` for the current corporation and alliance.
 * - Parses bio links and queues any discovered entities.
 * - Fetches character corporation history and queues all historical corps.
 * - Updates `last_discovery_at` in the character static record.
 * - Emits a `character_extracted` event.
 *
 * Performance: Medium -- ESI (on history crawl)
 *
 * @param {number} id - Target character EVE ID.
 * @param {unknown} rawData - Fresh character data from ESI.
 */
export async function extractFromCharacter(id: number, rawData: unknown): Promise<void> {
  try {
    logger.info('SYSTEM', `extractFromCharacter called for ${id}`);
    const dataParse = ESICharacterSchema.safeParse(rawData);
    if (!dataParse.success) {
      logger.error('SYSTEM', `Invalid character data from ESI for ${id}`, {
        error: dataParse.error,
      });
      return;
    }
    const data = dataParse.data;
    logger.info('SYSTEM', `extractFromCharacter parsed data for ${id}`, {
      corpId: data.corporation_id,
    });

    if (data.corporation_id) {
      const res = await addToQueue(data.corporation_id, 'corporation');
      logger.info(
        'SYSTEM',
        `addToQueue result for corp ${data.corporation_id}: ${res.isOk() ? 'OK' : 'ERR'}`,
      );
    }
    if (data.alliance_id) await addToQueue(data.alliance_id, 'alliance');

    const links = parseBioLinks(data.description || '');
    for (const link of links) {
      await addToQueue(link.id, link.type);
    }

    const historyRes = await getCharacterCorpHistory(id);
    if (historyRes.status === 'fresh') {
      const history = ESICorpHistorySchema.safeParse(historyRes.data);
      if (history.success) {
        for (const entry of history.data) {
          await addToQueue(entry.corporation_id, 'corporation');
        }
      } else {
        logger.error('SYSTEM', `Invalid corp history from ESI for character ${id}`, {
          error: history.error,
        });
      }
    }

    // Update last discovery timestamp
    await sql`
      UPDATE character_static
      SET last_discovery_at = NOW()
      WHERE character_id = ${id}
    `;
  } finally {
    emit('character_extracted', id);
  }
}

/**
 * Analyzes a Corporation and queues related entities.
 *
 * Side-Effects:
 * - Queues the CEO, Creator, and current Alliance.
 * - Fetches alliance history and queues all historical alliances.
 * - Parses description bio links.
 * - Updates `last_discovery_at` in the corporation static record.
 * - Emits a `corporation_extracted` event.
 *
 * Performance: Medium -- ESI (on history crawl)
 *
 * @param {number} id - Target corporation EVE ID.
 * @param {unknown} rawData - Fresh corporation data from ESI.
 */
export async function extractFromCorporation(
  id: number,
  rawData: unknown,
): Promise<void> {
  try {
    const dataParse = ESICorporationSchema.safeParse(rawData);
    if (!dataParse.success) {
      logger.error('SYSTEM', `Invalid corporation data from ESI for ${id}`, {
        error: dataParse.error,
      });
      return;
    }
    const data = dataParse.data;

    if (data.ceo_id) await addToQueue(data.ceo_id, 'character');
    if (data.creator_id) await addToQueue(data.creator_id, 'character');
    if (data.alliance_id) await addToQueue(data.alliance_id, 'alliance');

    const historyRes = await getCorpAllianceHistory(id);
    if (historyRes.status === 'fresh') {
      const history = ESIAllianceHistorySchema.safeParse(historyRes.data);
      if (history.success) {
        for (const entry of history.data) {
          if (entry.alliance_id) await addToQueue(entry.alliance_id, 'alliance');
        }
      }
    }

    const links = parseBioLinks(data.description || '');
    for (const link of links) {
      await addToQueue(link.id, link.type);
    }

    // Update last discovery timestamp
    await sql`
      UPDATE corporation_static
      SET last_discovery_at = NOW()
      WHERE corporation_id = ${id}
    `;
  } finally {
    emit('corporation_extracted', id);
  }
}

/**
 * Analyzes an Alliance and queues related entities.
 *
 * Side-Effects:
 * - Queues the Creator and Executor Corporation.
 * - Fetches all current member corporations and queues them.
 * - Parses description bio links.
 * - Updates `last_discovery_at` in the alliance static record.
 * - Emits an `alliance_extracted` event.
 *
 * Performance: Medium -- ESI (on member crawl)
 *
 * @param {number} id - Target alliance EVE ID.
 * @param {unknown} rawData - Fresh alliance data from ESI.
 */
export async function extractFromAlliance(id: number, rawData: unknown): Promise<void> {
  try {
    const dataParse = ESIAllianceSchema.safeParse(rawData);
    if (!dataParse.success) {
      logger.error('SYSTEM', `Invalid alliance data from ESI for ${id}`, {
        error: dataParse.error,
      });
      return;
    }
    const data = dataParse.data;

    if (data.creator_id) await addToQueue(data.creator_id, 'character');
    if (data.executor_corporation_id) await addToQueue(data.executor_corporation_id, 'corporation');

    const membersRes = await getAllianceMembers(id);
    if (membersRes.status === 'fresh') {
      const members = ESIAllianceMembersSchema.safeParse(membersRes.data);
      if (members.success) {
        for (const corpId of members.data) {
          await addToQueue(corpId, 'corporation');
        }
      }
    }

    const links = parseBioLinks(data.description || '');
    for (const link of links) {
      await addToQueue(link.id, link.type);
    }

    // Update last discovery timestamp
    await sql`
      UPDATE alliance_static
      SET last_discovery_at = NOW()
      WHERE alliance_id = ${id}
    `;
  } finally {
    emit('alliance_extracted', id);
  }
}
