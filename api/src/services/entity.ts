import { Err, Ok, Result } from 'ts-results-es';
import * as dbEntity from '../db/entity.ts';
import { fetchEntity } from '../clients/esi.ts';

/**
 * Gets a character by ID, using local cache or fetching from ESI.
 */
export async function getCharacter(
  id: number,
): Promise<Result<dbEntity.CharacterEntity | null, Error>> {
  try {
    // 1. Check local DB
    const localResult = await dbEntity.resolveById(id, 'character');
    if (localResult.isErr()) return localResult;

    const localEntity = localResult.value as dbEntity.CharacterEntity | null;

    // 2. Determine if we need to fetch from ESI
    const now = new Date();
    const isExpired = localEntity?.expiresAt ? localEntity.expiresAt < now : true;

    if (!localEntity || isExpired) {
      // 3. Fetch from ESI
      // deno-lint-ignore no-explicit-any
      const esiRes = await fetchEntity<any>(`/characters/${id}/`, localEntity?.etag);

      if (esiRes.status === 'fresh') {
        // 4a. 200 OK - Update static and append to ledger
        const updateStatic = await dbEntity.upsertStatic('character', {
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

        const appendLedger = await dbEntity.appendEphemeral('character', {
          characterId: id,
          corporationId: esiRes.data.corporation_id,
          allianceId: esiRes.data.alliance_id || null,
          securityStatus: esiRes.data.security_status,
        });
        if (appendLedger.isErr()) return appendLedger;

        // Return updated record
        return dbEntity.resolveById(id, 'character') as Promise<
          Result<dbEntity.CharacterEntity | null, Error>
        >;
      } else if (esiRes.status === 'not_modified') {
        // 4b. 304 Not Modified - Update expiry only
        if (localEntity) {
          const updateExpiry = await dbEntity.upsertStatic('character', {
            ...localEntity,
            expiresAt: esiRes.expiresAt,
            lastModifiedAt: new Date(),
          });
          if (updateExpiry.isErr()) return updateExpiry;

          return dbEntity.resolveById(id, 'character') as Promise<
            Result<dbEntity.CharacterEntity | null, Error>
          >;
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
 * Gets a corporation by ID.
 */
export async function getCorporation(
  id: number,
): Promise<Result<dbEntity.CorporationEntity | null, Error>> {
  try {
    const localResult = await dbEntity.resolveById(id, 'corporation');
    if (localResult.isErr()) return localResult;
    const localEntity = localResult.value as dbEntity.CorporationEntity | null;

    const now = new Date();
    const isExpired = localEntity?.expiresAt ? localEntity.expiresAt < now : true;

    if (!localEntity || isExpired) {
      // deno-lint-ignore no-explicit-any
      const esiRes = await fetchEntity<any>(`/corporations/${id}/`, localEntity?.etag);

      if (esiRes.status === 'fresh') {
        const updateStatic = await dbEntity.upsertStatic('corporation', {
          corporationId: id,
          name: esiRes.data.name,
          ticker: esiRes.data.ticker,
          dateFounded: esiRes.data.date_founded ? new Date(esiRes.data.date_founded) : null,
          creatorId: esiRes.data.creator_id,
          factionId: esiRes.data.faction_id,
          etag: esiRes.etag,
          expiresAt: esiRes.expiresAt,
          lastModifiedAt: new Date(),
        });
        if (updateStatic.isErr()) return updateStatic;

        const appendLedger = await dbEntity.appendEphemeral('corporation', {
          corporationId: id,
          allianceId: esiRes.data.alliance_id || null,
          ceoId: esiRes.data.ceo_id,
          memberCount: esiRes.data.member_count,
        });
        if (appendLedger.isErr()) return appendLedger;

        return dbEntity.resolveById(id, 'corporation') as Promise<
          Result<dbEntity.CorporationEntity | null, Error>
        >;
      } else if (esiRes.status === 'not_modified' && localEntity) {
        await dbEntity.upsertStatic('corporation', {
          ...localEntity,
          expiresAt: esiRes.expiresAt,
          lastModifiedAt: new Date(),
        });
        return dbEntity.resolveById(id, 'corporation') as Promise<
          Result<dbEntity.CorporationEntity | null, Error>
        >;
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
 * Gets an alliance by ID.
 */
export async function getAlliance(
  id: number,
): Promise<Result<dbEntity.AllianceEntity | null, Error>> {
  try {
    const localResult = await dbEntity.resolveById(id, 'alliance');
    if (localResult.isErr()) return localResult;
    const localEntity = localResult.value as dbEntity.AllianceEntity | null;

    const now = new Date();
    const isExpired = localEntity?.expiresAt ? localEntity.expiresAt < now : true;

    if (!localEntity || isExpired) {
      // deno-lint-ignore no-explicit-any
      const esiRes = await fetchEntity<any>(`/alliances/${id}/`, localEntity?.etag);

      if (esiRes.status === 'fresh') {
        const updateStatic = await dbEntity.upsertStatic('alliance', {
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

        const appendLedger = await dbEntity.appendEphemeral('alliance', {
          allianceId: id,
          executorCorpId: esiRes.data.executor_corporation_id || null,
          memberCount: esiRes.data.member_count,
        });
        if (appendLedger.isErr()) return appendLedger;

        return dbEntity.resolveById(id, 'alliance') as Promise<
          Result<dbEntity.AllianceEntity | null, Error>
        >;
      } else if (esiRes.status === 'not_modified' && localEntity) {
        await dbEntity.upsertStatic('alliance', {
          ...localEntity,
          expiresAt: esiRes.expiresAt,
          lastModifiedAt: new Date(),
        });
        return dbEntity.resolveById(id, 'alliance') as Promise<
          Result<dbEntity.AllianceEntity | null, Error>
        >;
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
 * Resolves an entity by its name, checking local cache first.
 */
export async function resolveByName(
  name: string,
  type: dbEntity.EntityType,
): Promise<Result<dbEntity.Entity | null, Error>> {
  try {
    const localResult = await dbEntity.resolveByName(name, type);
    if (localResult.isErr()) return localResult;

    if (localResult.value) {
      // deno-lint-ignore no-explicit-any
      const row = localResult.value as any;
      const id = row.characterId || row.corporationId || row.allianceId;
      if (type === 'character') return getCharacter(id);
      if (type === 'corporation') return getCorporation(id);
      return getAlliance(id);
    }

    return Ok(null);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}
