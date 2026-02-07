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

export const CorporationStaticSchema = z.object({
  corporationId: EveIdSchema,
  name: z.string(),
  ticker: z.string(),
  dateFounded: z.date().nullable(),
  creatorId: DbBigIntSchema.nullable(),
  factionId: DbBigIntSchema.nullable(),
  terminatedAt: z.date().nullable(),
}).merge(EsiCacheSchema).merge(DiscoveryTrackingSchema);

export const CorporationEphemeralSchema = z.object({
  recordId: z.string().uuid(),
  corporationId: EveIdSchema,
  allianceId: DbBigIntSchema.nullable(),
  ceoId: DbBigIntSchema,
  memberCount: DbBigIntSchema,
}).merge(RecordedAtSchema);

export const CorporationEntitySchema = CorporationStaticSchema.and(CorporationEphemeralSchema);

// --- Types ---

export type CorporationStatic = z.infer<typeof CorporationStaticSchema>;
export type CorporationEphemeral = z.infer<typeof CorporationEphemeralSchema>;
export type CorporationEntity = z.infer<typeof CorporationEntitySchema>;

/**
 * Resolves a corporation by its unique EVE Online ID.
 * 
 * Performance: Medium -- DB Join
 * Performs an INNER JOIN between `corporation_static` and the latest record 
 * in `corporation_ephemeral`.
 * 
 * @param {number} id - The EVE ID of the corporation.
 * @returns {Promise<Result<CorporationEntity | null, Error>>} The corporation data or null if not indexed.
 */
export async function resolveById(id: number): Promise<Result<CorporationEntity | null, Error>> {
  return await wrapAsync(async () => {
    const rows = await sql`
      SELECT 
        s.corporation_id as "corporationId",
        s.name,
        s.ticker,
        s.date_founded as "dateFounded",
        s.creator_id as "creatorId",
        s.faction_id as "factionId",
        s.etag,
        s.expires_at as "expiresAt",
        s.last_modified_at as "lastModifiedAt",
        s.terminated_at as "terminatedAt",
        s.access_count as "accessCount",
        s.last_discovery_at as "lastDiscoveryAt",
        e.record_id as "recordId",
        e.alliance_id as "allianceId",
        e.ceo_id as "ceoId",
        e.member_count as "memberCount",
        e.recorded_at as "recordedAt"
      FROM corporation_static s
      INNER JOIN corporation_ephemeral e ON s.corporation_id = e.corporation_id
      WHERE s.corporation_id = ${id}
      ORDER BY e.recorded_at DESC
      LIMIT 1
    `;

    if (rows.length === 0) return null;
    return CorporationEntitySchema.parse(rows[0]);
  });
}

/**
 * Resolves a corporation by its name.
 * 
 * Performance: Medium -- DB Join
 * Uses a B-Tree index on the name column for efficient retrieval.
 * 
 * @param {string} name - The exact name of the corporation.
 * @returns {Promise<Result<CorporationEntity | null, Error>>} The corporation data or null if not indexed.
 */
export async function resolveByName(name: string): Promise<Result<CorporationEntity | null, Error>> {
  return await wrapAsync(async () => {
    const rows = await sql`
      SELECT 
        s.corporation_id as "corporationId",
        s.name,
        s.ticker,
        s.date_founded as "dateFounded",
        s.creator_id as "creatorId",
        s.faction_id as "factionId",
        s.etag,
        s.expires_at as "expiresAt",
        s.last_modified_at as "lastModifiedAt",
        s.terminated_at as "terminatedAt",
        s.access_count as "accessCount",
        s.last_discovery_at as "lastDiscoveryAt",
        e.record_id as "recordId",
        e.alliance_id as "allianceId",
        e.ceo_id as "ceoId",
        e.member_count as "memberCount",
        e.recorded_at as "recordedAt"
      FROM corporation_static s
      INNER JOIN corporation_ephemeral e ON s.corporation_id = e.corporation_id
      WHERE s.name = ${name}
      ORDER BY e.recorded_at DESC
      LIMIT 1
    `;

    if (rows.length === 0) return null;
    return CorporationEntitySchema.parse(rows[0]);
  });
}

/**
 * Atomic UPSERT of static corporation identity data.
 * 
 * Side-Effects: Writes to `corporation_static` table.
 * Performance: Low -- DB Write
 * 
 * @param {CorporationStatic} values - The static identity fields to persist.
 * @param {Tx} [tx=sql] - Optional database or transaction client.
 * @returns {Promise<Result<void, Error>>} Success or database error.
 */
export async function upsertStatic(
  values: CorporationStatic,
  tx: Tx = sql,
): Promise<Result<void, Error>> {
  return await wrapAsync(async () => {
    await tx`
      INSERT INTO corporation_static (
        corporation_id, name, ticker, date_founded, creator_id, faction_id,
        etag, expires_at, last_modified_at, terminated_at, access_count, last_discovery_at
      ) VALUES (
        ${values.corporationId}, ${values.name}, ${values.ticker}, ${values.dateFounded}, ${values.creatorId}, ${values.factionId},
        ${values.etag}, ${values.expiresAt}, ${values.lastModifiedAt}, ${values.terminatedAt}, ${values.accessCount}, ${values.lastDiscoveryAt}
      )
      ON CONFLICT (corporation_id) DO UPDATE SET
        name = EXCLUDED.name,
        ticker = EXCLUDED.ticker,
        date_founded = EXCLUDED.date_founded,
        creator_id = EXCLUDED.creator_id,
        faction_id = EXCLUDED.faction_id,
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
 * Appends a new point-in-time snapshot to the corporation historical ledger.
 * 
 * Side-Effects: Writes a new UUIDv7-indexed row to `corporation_ephemeral`.
 * Performance: Low -- DB Write
 * 
 * @param {Omit<CorporationEphemeral, 'recordId' | 'recordedAt'>} values - The ephemeral state to append.
 * @param {Tx} [tx=sql] - Optional database or transaction client.
 * @returns {Promise<Result<void, Error>>} Success or database error.
 */
export async function appendEphemeral(
  values: Omit<CorporationEphemeral, 'recordId' | 'recordedAt'>,
  tx: Tx = sql,
): Promise<Result<void, Error>> {
  return await wrapAsync(async () => {
    const recordId = uuidv7();
    const recordedAt = new Date();
    await tx`
      INSERT INTO corporation_ephemeral (
        record_id, corporation_id, alliance_id, ceo_id, member_count, recorded_at
      ) VALUES (
        ${recordId}, ${values.corporationId}, ${values.allianceId}, ${values.ceoId}, ${values.memberCount}, ${recordedAt}
      )
    `;
  });
}
