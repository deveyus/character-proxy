import { db } from './client.ts';
import * as schema from './schema.ts';
import { desc, eq } from 'drizzle-orm';
import { Err, Ok, Result } from 'ts-results-es';
import { uuidv7 } from 'uuidv7';

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

/**
 * Upserts the static data and cache headers for an entity.
 */
export async function upsertStatic(
  type: EntityType,
  values:
    | typeof schema.characterStatic.$inferInsert
    | typeof schema.corporationStatic.$inferInsert
    | typeof schema.allianceStatic.$inferInsert,
): Promise<Result<void, Error>> {
  try {
    if (type === 'character') {
      await db.insert(schema.characterStatic)
        .values(values as typeof schema.characterStatic.$inferInsert)
        .onConflictDoUpdate({
          target: schema.characterStatic.characterId,
          set: values as typeof schema.characterStatic.$inferInsert,
        });
    } else if (type === 'corporation') {
      await db.insert(schema.corporationStatic)
        .values(values as typeof schema.corporationStatic.$inferInsert)
        .onConflictDoUpdate({
          target: schema.corporationStatic.corporationId,
          set: values as typeof schema.corporationStatic.$inferInsert,
        });
    } else {
      await db.insert(schema.allianceStatic)
        .values(values as typeof schema.allianceStatic.$inferInsert)
        .onConflictDoUpdate({
          target: schema.allianceStatic.allianceId,
          set: values as typeof schema.allianceStatic.$inferInsert,
        });
    }
    return Ok(void 0);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Appends a new ephemeral record to the historical ledger.
 */
export async function appendEphemeral(
  type: EntityType,
  values:
    | Omit<typeof schema.characterEphemeral.$inferInsert, 'recordId' | 'recordedAt'>
    | Omit<typeof schema.corporationEphemeral.$inferInsert, 'recordId' | 'recordedAt'>
    | Omit<typeof schema.allianceEphemeral.$inferInsert, 'recordId' | 'recordedAt'>,
): Promise<Result<void, Error>> {
  try {
    const recordId = uuidv7();
    const recordedAt = new Date();

    if (type === 'character') {
      await db.insert(schema.characterEphemeral).values({
        ...(values as typeof schema.characterEphemeral.$inferInsert),
        recordId,
        recordedAt,
      });
    } else if (type === 'corporation') {
      await db.insert(schema.corporationEphemeral).values({
        ...(values as typeof schema.corporationEphemeral.$inferInsert),
        recordId,
        recordedAt,
      });
    } else {
      await db.insert(schema.allianceEphemeral).values({
        ...(values as typeof schema.allianceEphemeral.$inferInsert),
        recordId,
        recordedAt,
      });
    }
    return Ok(void 0);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}
