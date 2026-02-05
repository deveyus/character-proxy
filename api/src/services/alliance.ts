import { Err, Ok, Result } from 'ts-results-es';
import * as db from '../db/alliance.ts';
import { fetchEntity } from '../clients/esi.ts';
import { FetchPriority } from '../clients/esi_limiter.ts';
import { ServiceResponse, shouldFetch } from './utils.ts';

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
 * Gets an alliance by ID.
 */
export async function getById(
  id: number,
  maxAge?: number,
  priority: FetchPriority = 'user',
): Promise<Result<ServiceResponse<db.AllianceEntity>, Error>> {
  try {
    const localResult = await db.resolveById(id);
    if (localResult.isErr()) return localResult;
    let localEntity = localResult.value;

    if (shouldFetch(localEntity?.expiresAt || null, localEntity?.lastModifiedAt || null, maxAge)) {
      const esiRes = await fetchEntity<ESIAlliance>(
        `/alliances/${id}/`,
        localEntity?.etag,
        priority,
      );

      if (esiRes.status === 'fresh') {
        await db.upsertStatic({
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

        await db.appendEphemeral({
          allianceId: id,
          executorCorpId: esiRes.data.executor_corporation_id || null,
          memberCount: esiRes.data.member_count,
        });

        const refreshed = await db.resolveById(id);
        if (refreshed.isErr()) return refreshed;
        localEntity = refreshed.value;
        if (localEntity) {
          return Ok({
            data: localEntity,
            metadata: {
              source: 'fresh',
              expiresAt: localEntity.expiresAt!,
              lastModifiedAt: localEntity.lastModifiedAt!,
            },
          });
        }
      } else if (esiRes.status === 'not_modified' && localEntity) {
        await db.upsertStatic({
          ...localEntity,
          expiresAt: esiRes.expiresAt,
          lastModifiedAt: new Date(),
        });
        const refreshed = await db.resolveById(id);
        if (refreshed.isErr()) return refreshed;
        localEntity = refreshed.value;
        if (localEntity) {
          return Ok({
            data: localEntity,
            metadata: {
              source: 'cache',
              expiresAt: localEntity.expiresAt!,
              lastModifiedAt: localEntity.lastModifiedAt!,
            },
          });
        }
      } else if (esiRes.status === 'error') {
        if (esiRes.error.message.includes('404')) {
          return Ok({
            data: null,
            metadata: { source: 'stale', expiresAt: new Date(0), lastModifiedAt: new Date(0) },
          });
        }
        if (localEntity) {
          return Ok({
            data: localEntity,
            metadata: {
              source: 'stale',
              expiresAt: localEntity.expiresAt!,
              lastModifiedAt: localEntity.lastModifiedAt!,
            },
          });
        }
        return Err(esiRes.error);
      }
    }

    if (localEntity) {
      return Ok({
        data: localEntity,
        metadata: {
          source: 'cache',
          expiresAt: localEntity.expiresAt!,
          lastModifiedAt: localEntity.lastModifiedAt!,
        },
      });
    }

    return Ok({
      data: null,
      metadata: { source: 'stale', expiresAt: new Date(0), lastModifiedAt: new Date(0) },
    });
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Resolves an alliance by its name.
 */
export async function getByName(
  name: string,
  maxAge?: number,
  priority: FetchPriority = 'user',
): Promise<Result<ServiceResponse<db.AllianceEntity>, Error>> {
  try {
    const localResult = await db.resolveByName(name);
    if (localResult.isErr()) return localResult;
    if (localResult.value) return getById(localResult.value.allianceId, maxAge, priority);
    return Ok({
      data: null,
      metadata: { source: 'stale', expiresAt: new Date(0), lastModifiedAt: new Date(0) },
    });
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}
