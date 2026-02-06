import { Err, Ok, Result } from 'ts-results-es';
import * as db from '../db/character.ts';
import { fetchEntity } from '../clients/esi.ts';
import { FetchPriority } from '../clients/esi_limiter.ts';
import { logger } from '../utils/logger.ts';
import { ServiceResponse, shouldFetch } from './utils.ts';
import { extractFromCharacter } from './discovery/extraction.ts';
import { db as pg } from '../db/client.ts';
import { characterStatic } from '../db/schema.ts';
import { eq, sql } from 'drizzle-orm';

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
  maxAge?: number,
  priority: FetchPriority = 'user',
): Promise<Result<ServiceResponse<db.CharacterEntity>, Error>> {
  try {
    // 1. Check local DB
    const localResult = await db.resolveById(id);
    if (localResult.isErr()) return localResult;

    let localEntity = localResult.value;

    // 2. Increment access count if user priority
    if (priority === 'user' && localEntity) {
      await pg.update(characterStatic)
        .set({ accessCount: sql`${characterStatic.accessCount} + 1` })
        .where(eq(characterStatic.characterId, id));
    }

    // 3. Decide if we fetch
    if (shouldFetch(localEntity?.expiresAt || null, localEntity?.lastModifiedAt || null, maxAge)) {
      const esiRes = await fetchEntity<ESICharacter>(
        `/characters/${id}/`,
        localEntity?.etag,
        priority,
      );

      if (esiRes.status === 'fresh') {
        // 4a. 200 OK - Atomic update
        await pg.transaction(async (tx) => {
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
          }, tx);
          if (updateStatic.isErr()) throw updateStatic.error;

          await db.appendEphemeral({
            characterId: id,
            corporationId: esiRes.data.corporation_id,
            allianceId: esiRes.data.alliance_id || null,
            securityStatus: esiRes.data.security_status,
          }, tx);
        });

        // Trigger discovery analysis (background)
        extractFromCharacter(id, esiRes.data).catch((err) => {
          logger.warn('SYSTEM', `Discovery extraction failed for character ${id}: ${err.message}`);
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
        // 304 Not Modified
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
        // Fallback to stale
        if (esiRes.type === 'not_found') {
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
          logger.warn(
            'ESI',
            `ESI fetch failed for character ${id}, serving stale data: ${esiRes.error.message}`,
          );
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

    // Default: return from cache
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
      metadata: {
        source: 'stale',
        expiresAt: new Date(0),
        lastModifiedAt: new Date(0),
      },
    });
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Resolves a character by its name.
 */
export async function getByName(
  name: string,
  maxAge?: number,
  priority: FetchPriority = 'user',
): Promise<Result<ServiceResponse<db.CharacterEntity>, Error>> {
  try {
    const localResult = await db.resolveByName(name);
    if (localResult.isErr()) return localResult;

    if (localResult.value) {
      return getById(localResult.value.characterId, maxAge, priority);
    }

    return Ok({
      data: null,
      metadata: { source: 'stale', expiresAt: new Date(0), lastModifiedAt: new Date(0) },
    });
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}
