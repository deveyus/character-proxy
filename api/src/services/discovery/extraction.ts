import { addToQueue } from './queue.ts';
import {
  getAllianceMembers,
  getCharacterCorpHistory,
  getCorpAllianceHistory,
} from '../../clients/esi.ts';
import { parseBioLinks } from '../../utils/bio_parser.ts';
import { db as pg } from '../../db/client.ts';
import { allianceStatic, characterStatic, corporationStatic } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';
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
 * Analyzes a Character and queues related entities.
 */
export async function extractFromCharacter(id: number, rawData: unknown): Promise<void> {
  const dataParse = ESICharacterSchema.safeParse(rawData);
  if (!dataParse.success) {
    logger.error('SYSTEM', `Invalid character data from ESI for ${id}`, {
      error: dataParse.error,
    });
    return;
  }
  const data = dataParse.data;

  if (data.corporation_id) await addToQueue(data.corporation_id, 'corporation');
  if (data.alliance_id) await addToQueue(data.alliance_id, 'alliance');

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
  await pg.update(characterStatic)
    .set({ lastDiscoveryAt: new Date() })
    .where(eq(characterStatic.characterId, id));
}

/**
 * Analyzes a Corporation and queues related entities.
 */
export async function extractFromCorporation(
  id: number,
  rawData: unknown,
): Promise<void> {
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
  await pg.update(corporationStatic)
    .set({ lastDiscoveryAt: new Date() })
    .where(eq(corporationStatic.corporationId, id));
}

/**
 * Analyzes an Alliance and queues related entities.
 */
export async function extractFromAlliance(id: number, rawData: unknown): Promise<void> {
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
  await pg.update(allianceStatic)
    .set({ lastDiscoveryAt: new Date() })
    .where(eq(allianceStatic.allianceId, id));
}
