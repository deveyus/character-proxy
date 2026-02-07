import * as schema from './schema.ts';
import { Result } from 'ts-results-es';
import {
  appendEphemeralEntity,
  EntityConfig,
  resolveEntityById,
  resolveEntityByName,
  Tx,
  upsertStaticEntity,
} from './base.ts';

export type AllianceEntity =
  & typeof schema.allianceStatic.$inferSelect
  & typeof schema.allianceEphemeral.$inferSelect;

const config: EntityConfig<typeof schema.allianceStatic, typeof schema.allianceEphemeral> = {
  staticTable: schema.allianceStatic,
  ephemeralTable: schema.allianceEphemeral,
  idColumn: (t) => t.allianceId,
  nameColumn: (t) => t.name,
};

/**
 * Resolves an alliance by its EVE ID.
 */
export async function resolveById(id: number): Promise<Result<AllianceEntity | null, Error>> {
  return await resolveEntityById(config, id);
}

/**
 * Resolves an alliance by its name.
 */
export async function resolveByName(name: string): Promise<Result<AllianceEntity | null, Error>> {
  return await resolveEntityByName(config, name);
}

/**
 * Upserts the static data and cache headers for an alliance.
 */
export async function upsertStatic(
  values: typeof schema.allianceStatic.$inferInsert,
  tx?: Tx,
): Promise<Result<void, Error>> {
  return await upsertStaticEntity(schema.allianceStatic, schema.allianceStatic.allianceId, values, tx);
}

/**
 * Appends a new ephemeral record to the alliance historical ledger.
 */
export async function appendEphemeral(
  values: Omit<typeof schema.allianceEphemeral.$inferInsert, 'recordId' | 'recordedAt'>,
  tx?: Tx,
): Promise<Result<void, Error>> {
  return await appendEphemeralEntity(schema.allianceEphemeral, values, tx);
}