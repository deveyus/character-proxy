import { Err, Ok, Result } from 'ts-results-es';
import * as db from '../db/corporation.ts';
import { fetchEntity } from '../clients/esi.ts';
import { FetchPriority } from '../clients/esi_limiter.ts';
import { ServiceResponse, shouldFetch } from './utils.ts';
import { extractFromCorporation } from './discovery/extraction.ts';
import { logger } from '../utils/logger.ts';
import { db as pg } from '../db/client.ts';
import { corporationStatic } from '../db/schema.ts';
import { eq, sql } from 'drizzle-orm';
import { metrics } from '../utils/metrics.ts';

interface ESICorporation {
  name: string;
  ticker: string;
  date_founded?: string;
  creator_id?: number;
  faction_id?: number;
  alliance_id?: number;
  ceo_id: number;
  member_count: number;
}

/**
 * Gets a corporation by ID.
 */
export async function getById(
  id: number,
  maxAge?: number,
  priority: FetchPriority = 'user',
): Promise<Result<ServiceResponse<db.CorporationEntity>, Error>> {
  try {
    const localResult = await db.resolveById(id);
    if (localResult.isErr()) return localResult;
    let localEntity = localResult.value;

    // 2. Increment access count if user priority
    if (priority === 'user' && localEntity) {
      await pg.update(corporationStatic)
        .set({ accessCount: sql`${corporationStatic.accessCount} + 1` })
        .where(eq(corporationStatic.corporationId, id));
    }

    if (shouldFetch(localEntity?.expiresAt || null, localEntity?.lastModifiedAt || null, maxAge)) {
      metrics.inc('cache_misses_total');
      const esiRes = await fetchEntity<ESICorporation>(
        `/corporations/${id}/`,
        localEntity?.etag,
        priority,
      );

      if (esiRes.status === 'fresh') {
        await pg.transaction(async (tx) => {
          const updateStatic = await db.upsertStatic({
            corporationId: id,
            name: esiRes.data.name,
            ticker: esiRes.data.ticker,
            dateFounded: esiRes.data.date_founded ? new Date(esiRes.data.date_founded) : null,
            creatorId: esiRes.data.creator_id,
            factionId: esiRes.data.faction_id,
            etag: esiRes.etag,
            expiresAt: esiRes.expiresAt,
            lastModifiedAt: new Date(),
          }, tx);
          if (updateStatic.isErr()) throw updateStatic.error;

          await db.appendEphemeral({
            corporationId: id,
            allianceId: esiRes.data.alliance_id || null,
            ceoId: esiRes.data.ceo_id,
            memberCount: esiRes.data.member_count,
          }, tx);
        });

        // Trigger discovery analysis (background)
        extractFromCorporation(id, esiRes.data).catch((err) => {
          logger.warn(
            'SYSTEM',
            `Discovery extraction failed for corporation ${id}: ${err.message}`,
          );
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
      }

      if (esiRes.status === 'not_modified' && localEntity) {
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
      }

      if (esiRes.status === 'error') {
        if (esiRes.type === 'not_found') {
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
      metrics.inc('cache_hits_total');
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
 * Resolves a corporation by its name.
 */
export async function getByName(
  name: string,
  maxAge?: number,
  priority: FetchPriority = 'user',
): Promise<Result<ServiceResponse<db.CorporationEntity>, Error>> {
  try {
    const localResult = await db.resolveByName(name);
    if (localResult.isErr()) return localResult;
    if (localResult.value) return getById(localResult.value.corporationId, maxAge, priority);
    return Ok({
      data: null,
      metadata: { source: 'stale', expiresAt: new Date(0), lastModifiedAt: new Date(0) },
    });
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}
