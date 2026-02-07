import { sql, Tx } from './client.ts';
import { z } from 'zod';
import {
  DbBigIntSchema,
  DiscoveryTrackingSchema,
  EsiCacheSchema,
  EveIdSchema,
  RecordedAtSchema,
} from './common.ts';
import { Result } from 'ts-results-es';
import { uuidv7 } from 'uuidv7';
import { wrapAsync } from '../utils/result.ts';

// --- Schemas ---

export const CharacterStaticSchema = z.object({
  characterId: EveIdSchema,
  name: z.string(),
  birthday: z.date(),
  gender: z.string(),
  raceId: DbBigIntSchema,
  bloodlineId: DbBigIntSchema,
  terminatedAt: z.date().nullable(),
}).merge(EsiCacheSchema).merge(DiscoveryTrackingSchema);

export const CharacterEphemeralSchema = z.object({
  recordId: z.string().uuid(),
  characterId: EveIdSchema,
  corporationId: DbBigIntSchema,
  allianceId: DbBigIntSchema.nullable(),
  securityStatus: z.number(),
}).merge(RecordedAtSchema);

export const CharacterEntitySchema = CharacterStaticSchema.and(CharacterEphemeralSchema);

// --- Types ---

export type CharacterStatic = z.infer<typeof CharacterStaticSchema>;
export type CharacterEphemeral = z.infer<typeof CharacterEphemeralSchema>;
export type CharacterEntity = z.infer<typeof CharacterEntitySchema>;

/**
 * Resolves a character by its unique EVE Online ID.
 * 
 * Performance: Medium -- DB Join
 * Performs an INNER JOIN between `character_static` and the latest record 
 * in `character_ephemeral`.
 * 
 * @param {number} id - The EVE ID of the character.
 * @returns {Promise<Result<CharacterEntity | null, Error>>} The character data or null if not indexed.
 */
export async function resolveById(id: number): Promise<Result<CharacterEntity | null, Error>> {
  return await wrapAsync(async () => {
    const rows = await sql`
      SELECT 
        s.character_id as "characterId",
        s.name,
        s.birthday,
        s.gender,
        s.race_id as "raceId",
        s.bloodline_id as "bloodlineId",
        s.etag,
        s.expires_at as "expiresAt",
        s.last_modified_at as "lastModifiedAt",
        s.terminated_at as "terminatedAt",
        s.access_count as "accessCount",
        s.last_discovery_at as "lastDiscoveryAt",
        e.record_id as "recordId",
        e.corporation_id as "corporationId",
        e.alliance_id as "allianceId",
        e.security_status as "securityStatus",
        e.recorded_at as "recordedAt"
      FROM character_static s
      INNER JOIN character_ephemeral e ON s.character_id = e.character_id
      WHERE s.character_id = ${id}
      ORDER BY e.recorded_at DESC
      LIMIT 1
    `;

    if (rows.length === 0) return null;
    return CharacterEntitySchema.parse(rows[0]);
  });
}

/**
 * Resolves a character by its name.
 * 
 * Performance: Medium -- DB Join
 * Uses a B-Tree index on the name column for efficient retrieval.
 * 
 * @param {string} name - The exact name of the character.
 * @returns {Promise<Result<CharacterEntity | null, Error>>} The character data or null if not indexed.
 */
export async function resolveByName(name: string): Promise<Result<CharacterEntity | null, Error>> {
  return await wrapAsync(async () => {
    const rows = await sql`
      SELECT 
        s.character_id as "characterId",
        s.name,
        s.birthday,
        s.gender,
        s.race_id as "raceId",
        s.bloodline_id as "bloodlineId",
        s.etag,
        s.expires_at as "expiresAt",
        s.last_modified_at as "lastModifiedAt",
        s.terminated_at as "terminatedAt",
        s.access_count as "accessCount",
        s.last_discovery_at as "lastDiscoveryAt",
        e.record_id as "recordId",
        e.corporation_id as "corporationId",
        e.alliance_id as "allianceId",
        e.security_status as "securityStatus",
        e.recorded_at as "recordedAt"
      FROM character_static s
      INNER JOIN character_ephemeral e ON s.character_id = e.character_id
      WHERE s.name = ${name}
      ORDER BY e.recorded_at DESC
      LIMIT 1
    `;

    if (rows.length === 0) return null;
    return CharacterEntitySchema.parse(rows[0]);
  });
}

/**
 * Atomic UPSERT of static character identity data.
 * 
 * Side-Effects: Writes to `character_static` table.
 * Performance: Low -- DB Write
 * 
 * @param {CharacterStatic} values - The static identity fields to persist.
 * @param {Tx} [tx=sql] - Optional database or transaction client.
 * @returns {Promise<Result<void, Error>>} Success or database error.
 */
export async function upsertStatic(
  values: CharacterStatic,
  tx: Tx = sql,
): Promise<Result<void, Error>> {
  return await wrapAsync(async () => {
    await tx`
      INSERT INTO character_static (
        character_id, name, birthday, gender, race_id, bloodline_id, 
        etag, expires_at, last_modified_at, terminated_at, access_count, last_discovery_at
      ) VALUES (
        ${values.characterId}, ${values.name}, ${values.birthday}, ${values.gender}, ${values.raceId}, ${values.bloodlineId},
        ${values.etag}, ${values.expiresAt}, ${values.lastModifiedAt}, ${values.terminatedAt}, ${values.accessCount}, ${values.lastDiscoveryAt}
      )
      ON CONFLICT (character_id) DO UPDATE SET
        name = EXCLUDED.name,
        birthday = EXCLUDED.birthday,
        gender = EXCLUDED.gender,
        race_id = EXCLUDED.race_id,
        bloodline_id = EXCLUDED.bloodline_id,
        etag = EXCLUDED.etag,
        expires_at = EXCLUDED.expires_at,
        last_modified_at = EXCLUDED.last_modified_at,
        terminated_at = EXCLUDED.terminated_at,
        access_count = EXCLUDED.access_count,
        last_discovery_at = EXCLUDED.last_discovery_at
    `;
  });
}

/**
 * Appends a new point-in-time snapshot to the character historical ledger.
 * 
 * Side-Effects: Writes a new UUIDv7-indexed row to `character_ephemeral`.
 * Performance: Low -- DB Write
 * 
 * @param {Omit<CharacterEphemeral, 'recordId' | 'recordedAt'>} values - The ephemeral state to append.
 * @param {Tx} [tx=sql] - Optional database or transaction client.
 * @returns {Promise<Result<void, Error>>} Success or database error.
 */
export async function appendEphemeral(
  values: Omit<CharacterEphemeral, 'recordId' | 'recordedAt'>,
  tx: Tx = sql,
): Promise<Result<void, Error>> {
  return await wrapAsync(async () => {
    const recordId = uuidv7();
    const recordedAt = new Date();
    await tx`
      INSERT INTO character_ephemeral (
        record_id, character_id, corporation_id, alliance_id, security_status, recorded_at
      ) VALUES (
        ${recordId}, ${values.characterId}, ${values.corporationId}, ${values.allianceId}, ${values.securityStatus}, ${recordedAt}
      )
    `;
  });
}