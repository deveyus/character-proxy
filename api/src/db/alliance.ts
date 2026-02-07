import { sql } from './client.ts';
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

export const AllianceStaticSchema = z.object({
  allianceId: EveIdSchema,
  name: z.string(),
  ticker: z.string(),
  dateFounded: z.date().nullable(),
  creatorId: DbBigIntSchema,
  creatorCorporationId: DbBigIntSchema,
  factionId: DbBigIntSchema.nullable(),
}).merge(EsiCacheSchema).merge(DiscoveryTrackingSchema);

export const AllianceEphemeralSchema = z.object({
  recordId: z.string().uuid(),
  allianceId: EveIdSchema,
  executorCorpId: DbBigIntSchema.nullable(),
  memberCount: DbBigIntSchema,
}).merge(RecordedAtSchema);

export const AllianceEntitySchema = AllianceStaticSchema.and(AllianceEphemeralSchema);

// --- Types ---

export type AllianceStatic = z.infer<typeof AllianceStaticSchema>;
export type AllianceEphemeral = z.infer<typeof AllianceEphemeralSchema>;
export type AllianceEntity = z.infer<typeof AllianceEntitySchema>;

// deno-lint-ignore no-explicit-any
export type Tx = any;

/**
 * Resolves an alliance by its EVE ID.
 */
export async function resolveById(id: number): Promise<Result<AllianceEntity | null, Error>> {
  return await wrapAsync(async () => {
    const rows = await sql`
      SELECT 
        s.alliance_id as "allianceId",
        s.name,
        s.ticker,
        s.date_founded as "dateFounded",
        s.creator_id as "creatorId",
        s.creator_corporation_id as "creatorCorporationId",
        s.faction_id as "factionId",
        s.etag,
        s.expires_at as "expiresAt",
        s.last_modified_at as "lastModifiedAt",
        s.access_count as "accessCount",
        s.last_discovery_at as "lastDiscoveryAt",
        e.record_id as "recordId",
        e.executor_corp_id as "executorCorpId",
        e.member_count as "memberCount",
        e.recorded_at as "recordedAt"
      FROM alliance_static s
      INNER JOIN alliance_ephemeral e ON s.alliance_id = e.alliance_id
      WHERE s.alliance_id = ${id}
      ORDER BY e.recorded_at DESC
      LIMIT 1
    `;

    if (rows.length === 0) return null;
    return AllianceEntitySchema.parse(rows[0]);
  });
}

/**
 * Resolves an alliance by its name.
 */
export async function resolveByName(name: string): Promise<Result<AllianceEntity | null, Error>> {
  return await wrapAsync(async () => {
    const rows = await sql`
      SELECT 
        s.alliance_id as "allianceId",
        s.name,
        s.ticker,
        s.date_founded as "dateFounded",
        s.creator_id as "creatorId",
        s.creator_corporation_id as "creatorCorporationId",
        s.faction_id as "factionId",
        s.etag,
        s.expires_at as "expiresAt",
        s.last_modified_at as "lastModifiedAt",
        s.access_count as "accessCount",
        s.last_discovery_at as "lastDiscoveryAt",
        e.record_id as "recordId",
        e.executor_corp_id as "executorCorpId",
        e.member_count as "memberCount",
        e.recorded_at as "recordedAt"
      FROM alliance_static s
      INNER JOIN alliance_ephemeral e ON s.alliance_id = e.alliance_id
      WHERE s.name = ${name}
      ORDER BY e.recorded_at DESC
      LIMIT 1
    `;

    if (rows.length === 0) return null;
    return AllianceEntitySchema.parse(rows[0]);
  });
}

/**
 * Upserts the static data and cache headers for an alliance.
 */
export async function upsertStatic(
  values: AllianceStatic,
  tx: Tx = sql,
): Promise<Result<void, Error>> {
  return await wrapAsync(async () => {
    await tx`
      INSERT INTO alliance_static (
        alliance_id, name, ticker, date_founded, creator_id, creator_corporation_id, faction_id,
        etag, expires_at, last_modified_at, access_count, last_discovery_at
      ) VALUES (
        ${values.allianceId}, ${values.name}, ${values.ticker}, ${values.dateFounded}, ${values.creatorId}, ${values.creatorCorporationId}, ${values.factionId},
        ${values.etag}, ${values.expiresAt}, ${values.lastModifiedAt}, ${values.accessCount}, ${values.lastDiscoveryAt}
      )
      ON CONFLICT (alliance_id) DO UPDATE SET
        name = EXCLUDED.name,
        ticker = EXCLUDED.ticker,
        date_founded = EXCLUDED.date_founded,
        creator_id = EXCLUDED.creator_id,
        creator_corporation_id = EXCLUDED.creator_corporation_id,
        faction_id = EXCLUDED.faction_id,
        etag = EXCLUDED.etag,
        expires_at = EXCLUDED.expires_at,
        last_modified_at = EXCLUDED.last_modified_at,
        access_count = EXCLUDED.access_count,
        last_discovery_at = EXCLUDED.last_discovery_at
    `;
  });
}

/**
 * Appends a new ephemeral record to the alliance historical ledger.
 */
export async function appendEphemeral(
  values: Omit<AllianceEphemeral, 'recordId' | 'recordedAt'>,
  tx: Tx = sql,
): Promise<Result<void, Error>> {
  return await wrapAsync(async () => {
    const recordId = uuidv7();
    const recordedAt = new Date();
    await tx`
      INSERT INTO alliance_ephemeral (
        record_id, alliance_id, executor_corp_id, member_count, recorded_at
      ) VALUES (
        ${recordId}, ${values.allianceId}, ${values.executorCorpId}, ${values.memberCount}, ${recordedAt}
      )
    `;
  });
}
