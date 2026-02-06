import { addToQueue } from './queue.ts';
import { getCharacterCorpHistory, getCorpAllianceHistory, getAllianceMembers } from '../../clients/esi.ts';
import { parseBioLinks } from '../../utils/bio_parser.ts';

/**
 * Analyzes a Character and queues related entities.
 */
export async function extractFromCharacter(id: number, data: any): Promise<void> {
  if (data.corporation_id) await addToQueue(data.corporation_id, 'corporation');
  if (data.alliance_id) await addToQueue(data.alliance_id, 'alliance');

  const history = await getCharacterCorpHistory(id);
  if (history.status === 'fresh') {
    for (const entry of history.data) {
      await addToQueue(entry.corporation_id, 'corporation');
    }
  }
}

/**
 * Analyzes a Corporation and queues related entities.
 */
export async function extractFromCorporation(id: number, data: any): Promise<void> {
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
}

/**
 * Analyzes an Alliance and queues related entities.
 */
export async function extractFromAlliance(id: number, data: any): Promise<void> {
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
}
