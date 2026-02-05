import { db } from '../client.ts';
import * as schema from '../schema.ts';
import { desc, eq } from 'drizzle-orm';
import { Err, Ok, Result } from 'ts-results-es';

export type EntityType = 'character' | 'corporation' | 'alliance';

export type CharacterEntity =
  & typeof schema.characterStatic.$inferSelect
  & typeof schema.characterEphemeral.$inferSelect;
export type CorporationEntity =
  & typeof schema.corporationStatic.$inferSelect
  & typeof schema.corporationEphemeral.$inferSelect;
export type AllianceEntity =
  & typeof schema.allianceStatic.$inferSelect
  & typeof schema.allianceEphemeral.$inferSelect;

export type Entity = CharacterEntity | CorporationEntity | AllianceEntity;

/**
 * Resolves an entity by its EVE ID.
 */
export async function resolveById(
  id: number,
  type: EntityType,
): Promise<Result<Entity | null, Error>> {
  try {
    let result;
    if (type === 'character') {
      result = await db
        .select()
        .from(schema.characterStatic)
        .innerJoin(
          schema.characterEphemeral,
          eq(schema.characterStatic.characterId, schema.characterEphemeral.characterId),
        )
        .where(eq(schema.characterStatic.characterId, id))
        .orderBy(desc(schema.characterEphemeral.recordedAt))
        .limit(1);
    } else if (type === 'corporation') {
      result = await db
        .select()
        .from(schema.corporationStatic)
        .innerJoin(
          schema.corporationEphemeral,
          eq(schema.corporationStatic.corporationId, schema.corporationEphemeral.corporationId),
        )
        .where(eq(schema.corporationStatic.corporationId, id))
        .orderBy(desc(schema.corporationEphemeral.recordedAt))
        .limit(1);
    } else {
      result = await db
        .select()
        .from(schema.allianceStatic)
        .innerJoin(
          schema.allianceEphemeral,
          eq(schema.allianceStatic.allianceId, schema.allianceEphemeral.allianceId),
        )
        .where(eq(schema.allianceStatic.allianceId, id))
        .orderBy(desc(schema.allianceEphemeral.recordedAt))
        .limit(1);
    }

    if (!result || result.length === 0) {
      return Ok(null);
    }

    // deno-lint-ignore no-explicit-any
    const row = result[0] as any;
    if (type === 'character') {
      return Ok({ ...row.character_static, ...row.character_ephemeral } as Entity);
    } else if (type === 'corporation') {
      return Ok({ ...row.corporation_static, ...row.corporation_ephemeral } as Entity);
    } else {
      return Ok({ ...row.alliance_static, ...row.alliance_ephemeral } as Entity);
    }
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Resolves an entity by its name.
 */
export async function resolveByName(
  name: string,
  type: EntityType,
): Promise<Result<Entity | null, Error>> {
  try {
    let result;
    if (type === 'character') {
      result = await db
        .select()
        .from(schema.characterStatic)
        .innerJoin(
          schema.characterEphemeral,
          eq(schema.characterStatic.characterId, schema.characterEphemeral.characterId),
        )
        .where(eq(schema.characterStatic.name, name))
        .orderBy(desc(schema.characterEphemeral.recordedAt))
        .limit(1);
    } else if (type === 'corporation') {
      result = await db
        .select()
        .from(schema.corporationStatic)
        .innerJoin(
          schema.corporationEphemeral,
          eq(schema.corporationStatic.corporationId, schema.corporationEphemeral.corporationId),
        )
        .where(eq(schema.corporationStatic.name, name))
        .orderBy(desc(schema.corporationEphemeral.recordedAt))
        .limit(1);
    } else {
      result = await db
        .select()
        .from(schema.allianceStatic)
        .innerJoin(
          schema.allianceEphemeral,
          eq(schema.allianceStatic.allianceId, schema.allianceEphemeral.allianceId),
        )
        .where(eq(schema.allianceStatic.name, name))
        .orderBy(desc(schema.allianceEphemeral.recordedAt))
        .limit(1);
    }

    if (!result || result.length === 0) {
      return Ok(null);
    }

    // deno-lint-ignore no-explicit-any
    const row = result[0] as any;
    if (type === 'character') {
      return Ok({ ...row.character_static, ...row.character_ephemeral } as Entity);
    } else if (type === 'corporation') {
      return Ok({ ...row.corporation_static, ...row.corporation_ephemeral } as Entity);
    } else {
      return Ok({ ...row.alliance_static, ...row.alliance_ephemeral } as Entity);
    }
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}
