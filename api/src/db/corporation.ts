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

export type CorporationEntity =
  & typeof schema.corporationStatic.$inferSelect
  & typeof schema.corporationEphemeral.$inferSelect;

const config: EntityConfig<typeof schema.corporationStatic, typeof schema.corporationEphemeral> = {
  staticTable: schema.corporationStatic,
  ephemeralTable: schema.corporationEphemeral,
  idColumn: (t) => t.corporationId,
  nameColumn: (t) => t.name,
};

/**
 * Resolves a corporation by its EVE ID.
 */
export async function resolveById(id: number): Promise<Result<CorporationEntity | null, Error>> {
  return await resolveEntityById(config, id);
}

/**
 * Resolves a corporation by its name.
 */
export async function resolveByName(name: string): Promise<Result<CorporationEntity | null, Error>> {
  return await resolveEntityByName(config, name);
}

/**
 * Upserts the static data and cache headers for a corporation.
 */
export async function upsertStatic(
  values: typeof schema.corporationStatic.$inferInsert,
  tx?: Tx,
): Promise<Result<void, Error>> {
  return await upsertStaticEntity(schema.corporationStatic, schema.corporationStatic.corporationId, values, tx);
}

/**
 * Appends a new ephemeral record to the corporation historical ledger.
 */
export async function appendEphemeral(
  values: Omit<typeof schema.corporationEphemeral.$inferInsert, 'recordId' | 'recordedAt'>,
  tx?: Tx,
): Promise<Result<void, Error>> {
  return await appendEphemeralEntity(schema.corporationEphemeral, values, tx);
}