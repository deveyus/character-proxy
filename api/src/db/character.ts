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

export type CharacterEntity =
  & typeof schema.characterStatic.$inferSelect
  & typeof schema.characterEphemeral.$inferSelect;

const config: EntityConfig<typeof schema.characterStatic, typeof schema.characterEphemeral> = {
  staticTable: schema.characterStatic,
  ephemeralTable: schema.characterEphemeral,
  idColumn: (t) => t.characterId,
  nameColumn: (t) => t.name,
};

/**
 * Resolves a character by its EVE ID.
 */
export async function resolveById(id: number): Promise<Result<CharacterEntity | null, Error>> {
  return await resolveEntityById(config, id);
}

/**
 * Resolves a character by its name.
 */
export async function resolveByName(name: string): Promise<Result<CharacterEntity | null, Error>> {
  return await resolveEntityByName(config, name);
}

/**
 * Upserts the static data and cache headers for a character.
 */
export async function upsertStatic(
  values: typeof schema.characterStatic.$inferInsert,
  tx?: Tx,
): Promise<Result<void, Error>> {
  return await upsertStaticEntity(schema.characterStatic, schema.characterStatic.characterId, values, tx);
}

/**
 * Appends a new ephemeral record to the character historical ledger.
 */
export async function appendEphemeral(
  values: Omit<typeof schema.characterEphemeral.$inferInsert, 'recordId' | 'recordedAt'>,
  tx?: Tx,
): Promise<Result<void, Error>> {
  return await appendEphemeralEntity(schema.characterEphemeral, values, tx);
}