import { Err, Ok, Result } from 'ts-results-es';
import * as db from '../db/character.ts';
import { fetchEntity } from '../clients/esi.ts';

interface ESICharacter {
  name: string;
  birthday: string;
  gender: string;
  race_id: number;
  bloodline_id: number;
  corporation_id: number;
  alliance_id?: number;
  security_status: number;
}

/**
 * Gets a character by ID, using local cache or fetching from ESI.
 */
export async function getById(
  id: number,
): Promise<Result<db.CharacterEntity | null, Error>> {
  try {
    // 1. Check local DB
    const localResult = await db.resolveById(id);
    if (localResult.isErr()) return localResult;

    const localEntity = localResult.value;

    // 2. Determine if we need to fetch from ESI
    const now = new Date();
    const isExpired = localEntity?.expiresAt ? localEntity.expiresAt < now : true;

    if (!localEntity || isExpired) {
      // 3. Fetch from ESI
      const esiRes = await fetchEntity<ESICharacter>(`/characters/${id}/`, localEntity?.etag);

      if (esiRes.status === 'fresh') {
        // 4a. 200 OK - Update static and append to ledger
        const updateStatic = await db.upsertStatic({
          characterId: id,
          name: esiRes.data.name,
          birthday: new Date(esiRes.data.birthday),
          gender: esiRes.data.gender,
          raceId: esiRes.data.race_id,
          bloodlineId: esiRes.data.bloodline_id,
          etag: esiRes.etag,
          expiresAt: esiRes.expiresAt,
          lastModifiedAt: new Date(),
        });
        if (updateStatic.isErr()) return updateStatic;

        const appendLedger = await db.appendEphemeral({
          characterId: id,
          corporationId: esiRes.data.corporation_id,
          allianceId: esiRes.data.alliance_id || null,
          securityStatus: esiRes.data.security_status,
        });
        if (appendLedger.isErr()) return appendLedger;

        // Return updated record
        return db.resolveById(id);
      } else if (esiRes.status === 'not_modified') {
        // 4b. 304 Not Modified - Update expiry only
        if (localEntity) {
          const updateExpiry = await db.upsertStatic({
            ...localEntity,
            expiresAt: esiRes.expiresAt,
            lastModifiedAt: new Date(),
          });
          if (updateExpiry.isErr()) return updateExpiry;

          return db.resolveById(id);
        }
      } else if (esiRes.status === 'error') {
        if (esiRes.error.message.includes('404')) {
          return Ok(null);
        }
        if (localEntity) {
          console.warn(`ESI fetch failed for character ${id}, serving stale data:`, esiRes.error);
          return Ok(localEntity);
        }
        return Err(esiRes.error);
      }
    }

    return Ok(localEntity);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Resolves a character by its name, checking local cache first.
 */
export async function getByName(
  name: string,
): Promise<Result<db.CharacterEntity | null, Error>> {
  try {
    const localResult = await db.resolveByName(name);
    if (localResult.isErr()) return localResult;

    if (localResult.value) {
      return getById(localResult.value.characterId);
    }

    return Ok(null);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}
