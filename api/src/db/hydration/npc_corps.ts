import { db as defaultDb } from '../client.ts';
import { corporationEphemeral, corporationStatic } from '../schema.ts';
import { eq } from 'drizzle-orm';
import { Err, Ok, Result } from 'ts-results-es';
import { uuidv7 } from 'uuidv7';

const ESI_BASE_URL = 'https://esi.evetech.net/latest';

/**
 * Hydrates the database with NPC corporations from ESI.
 */
export async function hydrateNpcCorporations(db: typeof defaultDb): Promise<Result<void, Error>> {
  try {
    console.log('Hydrating NPC corporations...');

    const response = await fetch(`${ESI_BASE_URL}/corporations/npccorps/`);
    if (!response.ok) {
      return Err(new Error(`Failed to fetch NPC corps list: ${response.statusText}`));
    }

    const npcCorpIds: number[] = await response.json();
    console.log(`Found ${npcCorpIds.length} NPC corporations.`);

    for (const corpId of npcCorpIds) {
      // 1. Fetch details from ESI (we always need them for ephemeral data)
      const detailRes = await fetch(`${ESI_BASE_URL}/corporations/${corpId}/`);
      if (!detailRes.ok) {
        console.warn(`Failed to fetch details for corp ${corpId}: ${detailRes.statusText}`);
        continue;
      }

      const details = await detailRes.json();

      // 2. Check if static data exists, if not insert it
      const existingStatic = await db.select().from(corporationStatic).where(
        eq(corporationStatic.corporationId, corpId),
      ).limit(1);

      if (existingStatic.length === 0) {
        await db.insert(corporationStatic).values({
          corporationId: corpId,
          name: details.name,
          ticker: details.ticker,
          dateFounded: details.date_founded ? new Date(details.date_founded) : null,
          creatorId: details.creator_id,
          factionId: details.faction_id,
        });
      }

      // 3. Append to ephemeral ledger
      await db.insert(corporationEphemeral).values({
        recordId: uuidv7(),
        corporationId: corpId,
        allianceId: details.alliance_id || null,
        ceoId: details.ceo_id,
        memberCount: details.member_count,
        recordedAt: new Date(),
      });
    }

    console.log('NPC corporation hydration complete.');
    return Ok(void 0);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}
