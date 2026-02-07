import { db } from './client.ts';
import { desc, eq } from 'drizzle-orm';
import { corporationEphemeral, corporationStatic } from './schema.ts';
import { Result } from 'ts-results-es';
import { uuidv7 } from 'uuidv7';
import { wrapAsync } from '../utils/result.ts';

// deno-lint-ignore no-explicit-any
export type Tx = any;

export type CorporationEntity =
  & typeof corporationStatic.$inferSelect
  & typeof corporationEphemeral.$inferSelect;

/**
 * Resolves a corporation by its EVE ID.
 */
export async function resolveById(id: number): Promise<Result<CorporationEntity | null, Error>> {
  return await wrapAsync(async () => {
    const result = await db
      .select({
        static: corporationStatic,
        ephemeral: corporationEphemeral,
      })
      .from(corporationStatic)
      .innerJoin(
        corporationEphemeral,
        eq(corporationStatic.corporationId, corporationEphemeral.corporationId),
      )
      .where(eq(corporationStatic.corporationId, id))
      .orderBy(desc(corporationEphemeral.recordedAt))
      .limit(1);

    if (result.length === 0) return null;
    return { ...result[0].static, ...result[0].ephemeral };
  });
}

/**
 * Resolves a corporation by its name.
 */
export async function resolveByName(name: string): Promise<Result<CorporationEntity | null, Error>> {
  return await wrapAsync(async () => {
    const result = await db
      .select({
        static: corporationStatic,
        ephemeral: corporationEphemeral,
      })
      .from(corporationStatic)
      .innerJoin(
        corporationEphemeral,
        eq(corporationStatic.corporationId, corporationEphemeral.corporationId),
      )
      .where(eq(corporationStatic.name, name))
      .orderBy(desc(corporationEphemeral.recordedAt))
      .limit(1);

    if (result.length === 0) return null;
    return { ...result[0].static, ...result[0].ephemeral };
  });
}

/**
 * Upserts the static data and cache headers for a corporation.
 */
export async function upsertStatic(
  values: typeof corporationStatic.$inferInsert,
  tx: Tx = db,
): Promise<Result<void, Error>> {
  return await wrapAsync(async () => {
    await tx.insert(corporationStatic)
      .values(values)
      .onConflictDoUpdate({
        target: corporationStatic.corporationId,
        set: values,
      });
  });
}

/**
 * Appends a new ephemeral record to the corporation historical ledger.
 */
export async function appendEphemeral(
  values: Omit<typeof corporationEphemeral.$inferInsert, 'recordId' | 'recordedAt'>,
  tx: Tx = db,
): Promise<Result<void, Error>> {
  return await wrapAsync(async () => {
    await tx.insert(corporationEphemeral).values({
      ...values,
      recordId: uuidv7(),
      recordedAt: new Date(),
    });
  });
}