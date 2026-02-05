import { Err, Ok, Result } from 'ts-results-es';
import * as db from '../db/alliance.ts';
import { fetchEntity } from '../clients/esi.ts';

interface ESIAlliance {
  name: string;
  ticker: string;
  date_founded?: string;
  creator_id: number;
  creator_corporation_id: number;
  faction_id?: number;
  executor_corporation_id?: number;
  member_count: number;
}

/**
 * Gets an alliance by ID, using local cache or fetching from ESI.
 */
export async function getById(
  id: number,
): Promise<Result<db.AllianceEntity | null, Error>> {
  try {
    const localResult = await db.resolveById(id);
    if (localResult.isErr()) return localResult;

    const localEntity = localResult.value;

    const now = new Date();
    const isExpired = localEntity?.expiresAt ? localEntity.expiresAt < now : true;

    if (!localEntity || isExpired) {
      const esiRes = await fetchEntity<ESIAlliance>(`/alliances/${id}/`, localEntity?.etag);

      if (esiRes.status === 'fresh') {
        const updateStatic = await db.upsertStatic({
          allianceId: id,
          name: esiRes.data.name,
          ticker: esiRes.data.ticker,
          dateFounded: esiRes.data.date_founded ? new Date(esiRes.data.date_founded) : null,
          creatorId: esiRes.data.creator_id,
          creatorCorporationId: esiRes.data.creator_corporation_id,
          factionId: esiRes.data.faction_id,
          etag: esiRes.etag,
          expiresAt: esiRes.expiresAt,
          lastModifiedAt: new Date(),
        });
        if (updateStatic.isErr()) return updateStatic;

        const appendLedger = await db.appendEphemeral({
          allianceId: id,
          executorCorpId: esiRes.data.executor_corporation_id || null,
          memberCount: esiRes.data.member_count,
        });
        if (appendLedger.isErr()) return appendLedger;

        return db.resolveById(id);
      } else if (esiRes.status === 'not_modified' && localEntity) {
        const updateExpiry = await db.upsertStatic({
          ...localEntity,
          expiresAt: esiRes.expiresAt,
          lastModifiedAt: new Date(),
        });
        if (updateExpiry.isErr()) return updateExpiry;
        return db.resolveById(id);
      } else if (esiRes.status === 'error') {
        if (esiRes.error.message.includes('404')) return Ok(null);
        if (localEntity) return Ok(localEntity);
        return Err(esiRes.error);
      }
    }
    return Ok(localEntity);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Resolves an alliance by its name.
 */
export async function getByName(
  name: string,
): Promise<Result<db.AllianceEntity | null, Error>> {
  try {
    const localResult = await db.resolveByName(name);
    if (localResult.isErr()) return localResult;

    if (localResult.value) {
      return getById(localResult.value.allianceId);
    }

    return Ok(null);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}
