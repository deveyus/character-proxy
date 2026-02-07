import { Err, Ok, Result } from 'ts-results-es';
import * as db from '../db/corporation.ts';
import { fetchEntity } from '../clients/esi.ts';
import { FetchPriority } from '../clients/esi_limiter.ts';
import { ServiceResponse, shouldFetch } from './utils.ts';
import { extractFromCorporation } from './discovery/extraction.ts';
import { logger } from '../utils/logger.ts';
import { sql } from '../db/client.ts';
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
  date_terminated?: string;
}

/**
 * Retrieves a corporation by its EVE ID, utilizing a local cache with ESI fallback.
 * 
 * Side-Effects:
 * - Increments `access_count` in the database.
 * - Writes fresh ESI data to `corporation_static` and `corporation_ephemeral`.
 * - Triggers asynchronous background discovery analysis (`extractFromCorporation`).
 * - Marks known corporations as terminated if ESI returns a 404 or indicates closure.
 * 
 * Performance: High -- ESI (on cache miss) | Medium -- DB Join (on cache hit)
 * 
 * @param {number} id - The EVE Online corporation ID.
 * @param {number} [maxAge] - Optional freshness requirement.
 * @param {FetchPriority} [priority='user'] - Priority level for the ESI rate limiter.
 * @returns {Promise<Result<ServiceResponse<db.CorporationEntity>, Error>>} 
 * A result containing the corporation data and cache metadata.
 * 
 * @example
 * const result = await corporationService.getById(1000171);
 * if (result.isOk() && result.value.data) {
 *   console.log(`CEO ID: ${result.value.data.ceoId}`);
 * }
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
      sql`
        UPDATE corporation_static
        SET access_count = access_count + 1
        WHERE corporation_id = ${id}
      `.catch(err => logger.warn('DB', `Failed to increment access count for corporation ${id}: ${err.message}`));
    }

    if (shouldFetch(localEntity?.expiresAt || null, localEntity?.lastModifiedAt || null, maxAge)) {
      metrics.inc('cache_misses_total');
      const esiRes = await fetchEntity<ESICorporation>(
        `/corporations/${id}/`,
        localEntity?.etag,
        priority,
      );

      if (esiRes.status === 'fresh') {
        // deno-lint-ignore no-explicit-any
        const transactionResult = await sql.begin(async (tx: any) => {
          const updateStatic = await db.upsertStatic({
            corporationId: id,
            name: esiRes.data.name,
            ticker: esiRes.data.ticker,
            dateFounded: esiRes.data.date_founded ? new Date(esiRes.data.date_founded) : null,
            creatorId: esiRes.data.creator_id || null,
            factionId: esiRes.data.faction_id || null,
            terminatedAt: esiRes.data.date_terminated ? new Date(esiRes.data.date_terminated) : null,
            etag: esiRes.etag,
            expiresAt: esiRes.expiresAt,
            lastModifiedAt: new Date(),
            accessCount: localEntity?.accessCount ?? 0,
            lastDiscoveryAt: localEntity?.lastDiscoveryAt ?? null,
          }, tx);
          if (updateStatic.isErr()) throw updateStatic.error;

          await db.appendEphemeral({
            corporationId: id,
            allianceId: esiRes.data.alliance_id || null,
            ceoId: esiRes.data.ceo_id,
            memberCount: esiRes.data.member_count,
          }, tx);
        }).then(() => Ok(void 0)).catch(err => Err(err));

        if (transactionResult.isErr()) return transactionResult;

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
          if (localEntity) {
            logger.info('ESI', `Corporation ${id} no longer exists, marking as terminated.`);
            await db.upsertStatic({
              ...localEntity,
              terminatedAt: new Date(),
              lastModifiedAt: new Date(),
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
          return Ok({
            data: null,
            metadata: {
              source: 'stale',
              expiresAt: new Date(0),
              lastModifiedAt: new Date(0),
            },
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
 * Resolves a corporation by its exact name.
 * 
 * Side-Effects: Triggers `getById` if the name is found locally.
 * Performance: Medium -- DB Lookup | High -- ESI (on internal getById miss)
 * 
 * @param {string} name - The exact corporation name.
 * @param {number} [maxAge] - Optional freshness requirement.
 * @param {FetchPriority} [priority='user'] - Priority level for the ESI rate limiter.
 * @returns {Promise<Result<ServiceResponse<db.CorporationEntity>, Error>>} 
 * A result containing the corporation data.
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