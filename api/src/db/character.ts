import { db } from './client.ts';
import { desc, eq } from 'drizzle-orm';
import { characterEphemeral, characterStatic } from './schema.ts';
import { Result } from 'ts-results-es';
import { uuidv7 } from 'uuidv7';
import { wrapAsync } from '../utils/result.ts';

// deno-lint-ignore no-explicit-any
export type Tx = any;

export type CharacterEntity =
  & typeof characterStatic.$inferSelect
  & typeof characterEphemeral.$inferSelect;

/**
 * Resolves a character by its EVE ID.
 */
export async function resolveById(id: number): Promise<Result<CharacterEntity | null, Error>> {
  return await wrapAsync(async () => {
    const result = await db
      .select({
        static: characterStatic,
        ephemeral: characterEphemeral,
      })
      .from(characterStatic)
      .innerJoin(
        characterEphemeral,
        eq(characterStatic.characterId, characterEphemeral.characterId),
      )
      .where(eq(characterStatic.characterId, id))
      .orderBy(desc(characterEphemeral.recordedAt))
      .limit(1);

    if (result.length === 0) return null;
    return { ...result[0].static, ...result[0].ephemeral };
  });
}

/**
 * Resolves a character by its name.
 */
export async function resolveByName(name: string): Promise<Result<CharacterEntity | null, Error>> {
  return await wrapAsync(async () => {
    const result = await db
      .select({
        static: characterStatic,
        ephemeral: characterEphemeral,
      })
      .from(characterStatic)
      .innerJoin(
        characterEphemeral,
        eq(characterStatic.characterId, characterEphemeral.characterId),
      )
      .where(eq(characterStatic.name, name))
      .orderBy(desc(characterEphemeral.recordedAt))
      .limit(1);

    if (result.length === 0) return null;
    return { ...result[0].static, ...result[0].ephemeral };
  });
}

/**
 * Upserts the static data and cache headers for a character.
 */
export async function upsertStatic(
  values: typeof characterStatic.$inferInsert,
  tx: Tx = db,
): Promise<Result<void, Error>> {
  return await wrapAsync(async () => {
    await tx.insert(characterStatic)
      .values(values)
      .onConflictDoUpdate({
        target: characterStatic.characterId,
        set: values,
      });
  });
}

/**
 * Appends a new ephemeral record to the character historical ledger.
 */
export async function appendEphemeral(
  values: Omit<typeof characterEphemeral.$inferInsert, 'recordId' | 'recordedAt'>,
  tx: Tx = db,
): Promise<Result<void, Error>> {
  return await wrapAsync(async () => {
    await tx.insert(characterEphemeral).values({
      ...values,
      recordId: uuidv7(),
      recordedAt: new Date(),
    });
  });
}
