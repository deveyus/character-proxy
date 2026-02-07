import { db } from './client.ts';
import { desc, eq } from 'drizzle-orm';
import { allianceEphemeral, allianceStatic } from './schema.ts';
import { Result } from 'ts-results-es';
import { uuidv7 } from 'uuidv7';
import { wrapAsync } from '../utils/result.ts';

// deno-lint-ignore no-explicit-any
export type Tx = any;

export type AllianceEntity =
  & typeof allianceStatic.$inferSelect
  & typeof allianceEphemeral.$inferSelect;

/**
 * Resolves an alliance by its EVE ID.
 */
export async function resolveById(id: number): Promise<Result<AllianceEntity | null, Error>> {
  return await wrapAsync(async () => {
    const result = await db
      .select({
        static: allianceStatic,
        ephemeral: allianceEphemeral,
      })
      .from(allianceStatic)
      .innerJoin(
        allianceEphemeral,
        eq(allianceStatic.allianceId, allianceEphemeral.allianceId),
      )
      .where(eq(allianceStatic.allianceId, id))
      .orderBy(desc(allianceEphemeral.recordedAt))
      .limit(1);

    if (result.length === 0) return null;
    return { ...result[0].static, ...result[0].ephemeral };
  });
}

/**
 * Resolves an alliance by its name.
 */
export async function resolveByName(name: string): Promise<Result<AllianceEntity | null, Error>> {
  return await wrapAsync(async () => {
    const result = await db
      .select({
        static: allianceStatic,
        ephemeral: allianceEphemeral,
      })
      .from(allianceStatic)
      .innerJoin(
        allianceEphemeral,
        eq(allianceStatic.allianceId, allianceEphemeral.allianceId),
      )
      .where(eq(allianceStatic.name, name))
      .orderBy(desc(allianceEphemeral.recordedAt))
      .limit(1);

    if (result.length === 0) return null;
    return { ...result[0].static, ...result[0].ephemeral };
  });
}

/**
 * Upserts the static data and cache headers for an alliance.
 */
export async function upsertStatic(
  values: typeof allianceStatic.$inferInsert,
  tx: Tx = db,
): Promise<Result<void, Error>> {
  return await wrapAsync(async () => {
    await tx.insert(allianceStatic)
      .values(values)
      .onConflictDoUpdate({
        target: allianceStatic.allianceId,
        set: values,
      });
  });
}

/**
 * Appends a new ephemeral record to the alliance historical ledger.
 */
export async function appendEphemeral(
  values: Omit<typeof allianceEphemeral.$inferInsert, 'recordId' | 'recordedAt'>,
  tx: Tx = db,
): Promise<Result<void, Error>> {
  return await wrapAsync(async () => {
    await tx.insert(allianceEphemeral).values({
      ...values,
      recordId: uuidv7(),
      recordedAt: new Date(),
    });
  });
}