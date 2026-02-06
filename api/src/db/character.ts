import { db } from './client.ts';
import * as schema from './schema.ts';
import { desc, eq } from 'drizzle-orm';
import { Err, Ok, Result } from 'ts-results-es';
import { uuidv7 } from 'uuidv7';

export type CharacterEntity =
  & typeof schema.characterStatic.$inferSelect
  & typeof schema.characterEphemeral.$inferSelect;

type Tx = {
  insert: typeof db.insert;
  update: typeof db.update;
  delete: typeof db.delete;
  select: typeof db.select;
  execute: typeof db.execute;
};

/**
 * Resolves a character by its EVE ID.
 */
export async function resolveById(
  id: number,
): Promise<Result<CharacterEntity | null, Error>> {
  try {
    const result = await db
      .select()
      .from(schema.characterStatic)
      .innerJoin(
        schema.characterEphemeral,
        eq(schema.characterStatic.characterId, schema.characterEphemeral.characterId),
      )
      .where(eq(schema.characterStatic.characterId, id))
      .orderBy(desc(schema.characterEphemeral.recordedAt))
      .limit(1);

    if (result.length === 0) {
      return Ok(null);
    }

    const { character_static, character_ephemeral } = result[0];
    return Ok({ ...character_static, ...character_ephemeral });
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Resolves a character by its name.
 */
export async function resolveByName(
  name: string,
): Promise<Result<CharacterEntity | null, Error>> {
  try {
    const result = await db
      .select()
      .from(schema.characterStatic)
      .innerJoin(
        schema.characterEphemeral,
        eq(schema.characterStatic.characterId, schema.characterEphemeral.characterId),
      )
      .where(eq(schema.characterStatic.name, name))
      .orderBy(desc(schema.characterEphemeral.recordedAt))
      .limit(1);

    if (result.length === 0) {
      return Ok(null);
    }

    const { character_static, character_ephemeral } = result[0];
    return Ok({ ...character_static, ...character_ephemeral });
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Upserts the static data and cache headers for a character.
 */
export async function upsertStatic(
  values: typeof schema.characterStatic.$inferInsert,
  tx: Tx = db as unknown as Tx,
): Promise<Result<void, Error>> {
  try {
    await tx.insert(schema.characterStatic)
      .values(values)
      .onConflictDoUpdate({
        target: schema.characterStatic.characterId,
        set: values,
      });
    return Ok(void 0);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Appends a new ephemeral record to the character historical ledger.
 */
export async function appendEphemeral(
  values: Omit<typeof schema.characterEphemeral.$inferInsert, 'recordId' | 'recordedAt'>,
  tx: Tx = db as unknown as Tx,
): Promise<Result<void, Error>> {
  try {
    await tx.insert(schema.characterEphemeral).values({
      ...values,
      recordId: uuidv7(),
      recordedAt: new Date(),
    });
    return Ok(void 0);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}
