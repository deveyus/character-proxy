import { db } from './client.ts';
import * as schema from './schema.ts';
import { desc, eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { Err, Ok, Result } from 'ts-results-es';
import { uuidv7 } from 'uuidv7';

export type CorporationEntity =
  & typeof schema.corporationStatic.$inferSelect
  & typeof schema.corporationEphemeral.$inferSelect;

type Tx = PostgresJsDatabase<typeof schema>;

/**
 * Resolves a corporation by its EVE ID.
 */
export async function resolveById(
  id: number,
): Promise<Result<CorporationEntity | null, Error>> {
  try {
    const result = await db
      .select()
      .from(schema.corporationStatic)
      .innerJoin(
        schema.corporationEphemeral,
        eq(schema.corporationStatic.corporationId, schema.corporationEphemeral.corporationId),
      )
      .where(eq(schema.corporationStatic.corporationId, id))
      .orderBy(desc(schema.corporationEphemeral.recordedAt))
      .limit(1);

    if (result.length === 0) {
      return Ok(null);
    }

    const { corporation_static, corporation_ephemeral } = result[0];
    return Ok({ ...corporation_static, ...corporation_ephemeral });
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Resolves a corporation by its name.
 */
export async function resolveByName(
  name: string,
): Promise<Result<CorporationEntity | null, Error>> {
  try {
    const result = await db
      .select()
      .from(schema.corporationStatic)
      .innerJoin(
        schema.corporationEphemeral,
        eq(schema.corporationStatic.corporationId, schema.corporationEphemeral.corporationId),
      )
      .where(eq(schema.corporationStatic.name, name))
      .orderBy(desc(schema.corporationEphemeral.recordedAt))
      .limit(1);

    if (result.length === 0) {
      return Ok(null);
    }

    const { corporation_static, corporation_ephemeral } = result[0];
    return Ok({ ...corporation_static, ...corporation_ephemeral });
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Upserts the static data and cache headers for a corporation.
 */
export async function upsertStatic(
  values: typeof schema.corporationStatic.$inferInsert,
  tx: Tx = db,
): Promise<Result<void, Error>> {
  try {
    await tx.insert(schema.corporationStatic)
      .values(values)
      .onConflictDoUpdate({
        target: schema.corporationStatic.corporationId,
        set: values,
      });
    return Ok(void 0);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Appends a new ephemeral record to the corporation historical ledger.
 */
export async function appendEphemeral(
  values: Omit<typeof schema.corporationEphemeral.$inferInsert, 'recordId' | 'recordedAt'>,
  tx: Tx = db,
): Promise<Result<void, Error>> {
  try {
    await tx.insert(schema.corporationEphemeral).values({
      ...values,
      recordId: uuidv7(),
      recordedAt: new Date(),
    });
    return Ok(void 0);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}
