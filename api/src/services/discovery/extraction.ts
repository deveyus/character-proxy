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

// --- Event Synchronization ---

export type DiscoveryEvent = 'character_extracted' | 'corporation_extracted' | 'alliance_extracted';
type DiscoveryCallback = (id: number) => void;

const listeners = new Map<DiscoveryEvent, Set<DiscoveryCallback>>();

/**
 * Registers a listener for discovery events.
 */
export function onDiscoveryEvent(event: DiscoveryEvent, cb: DiscoveryCallback) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(cb);
}

/**
 * Unregisters a listener.
 */
export function offDiscoveryEvent(event: DiscoveryEvent, cb: DiscoveryCallback) {
  listeners.get(event)?.delete(cb);
}

function emit(event: DiscoveryEvent, id: number) {
  listeners.get(event)?.forEach(cb => cb(id));
}

/**
 * Analyzes a Character and queues related entities.
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
    logger.info('SYSTEM', `extractFromCharacter parsed data for ${id}`, { corpId: data.corporation_id });

    if (data.corporation_id) {
      const res = await addToQueue(data.corporation_id, 'corporation');
      logger.info('SYSTEM', `addToQueue result for corp ${data.corporation_id}: ${res.isOk() ? 'OK' : 'ERR'}`);
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
