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

interface CharacterDiscoveryData {
  corporation_id: number;
  alliance_id?: number;
}

interface CorporationDiscoveryData {
  ceo_id: number;
  creator_id?: number;
  alliance_id?: number;
  description?: string;
}

interface AllianceDiscoveryData {
  creator_id: number;
  executor_corporation_id?: number;
  description?: string;
}

/**
 * Analyzes a Character and queues related entities.
 */
export async function extractFromCharacter(
  id: number,
  data: CharacterDiscoveryData,
): Promise<void> {
  if (data.corporation_id) await addToQueue(data.corporation_id, 'corporation');
  if (data.alliance_id) await addToQueue(data.alliance_id, 'alliance');

  const history = await getCharacterCorpHistory(id);
  if (history.status === 'fresh') {
    for (const entry of history.data) {
      await addToQueue(entry.corporation_id, 'corporation');
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
  data: CorporationDiscoveryData,
): Promise<void> {
  if (data.ceo_id) await addToQueue(data.ceo_id, 'character');
  if (data.creator_id) await addToQueue(data.creator_id, 'character');
  if (data.alliance_id) await addToQueue(data.alliance_id, 'alliance');

  const history = await getCorpAllianceHistory(id);
  if (history.status === 'fresh') {
    for (const entry of history.data) {
      if (entry.alliance_id) await addToQueue(entry.alliance_id, 'alliance');
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
export async function extractFromAlliance(id: number, data: AllianceDiscoveryData): Promise<void> {
  if (data.creator_id) await addToQueue(data.creator_id, 'character');
  if (data.executor_corporation_id) await addToQueue(data.executor_corporation_id, 'corporation');

  const members = await getAllianceMembers(id);
  if (members.status === 'fresh') {
    for (const corpId of members.data) {
      await addToQueue(corpId, 'corporation');
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
