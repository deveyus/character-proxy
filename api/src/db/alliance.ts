import { db } from './client.ts';
import * as schema from './schema.ts';
import { desc, eq } from 'drizzle-orm';
import { Err, Ok, Result } from 'ts-results-es';
import { uuidv7 } from 'uuidv7';

export type AllianceEntity =
  & typeof schema.allianceStatic.$inferSelect
  & typeof schema.allianceEphemeral.$inferSelect;

/**
 * Resolves an alliance by its EVE ID.
 */
export async function resolveById(
  id: number,
): Promise<Result<AllianceEntity | null, Error>> {
  try {
    const result = await db
      .select()
      .from(schema.allianceStatic)
      .innerJoin(
        schema.allianceEphemeral,
        eq(schema.allianceStatic.allianceId, schema.allianceEphemeral.allianceId),
      )
      .where(eq(schema.allianceStatic.allianceId, id))
      .orderBy(desc(schema.allianceEphemeral.recordedAt))
      .limit(1);

    if (result.length === 0) {
      return Ok(null);
    }

    const { alliance_static, alliance_ephemeral } = result[0];
    return Ok({ ...alliance_static, ...alliance_ephemeral });
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Resolves an alliance by its name.
 */
export async function resolveByName(
  name: string,
): Promise<Result<AllianceEntity | null, Error>> {
  try {
    const result = await db
      .select()
      .from(schema.allianceStatic)
      .innerJoin(
        schema.allianceEphemeral,
        eq(schema.allianceStatic.allianceId, schema.allianceEphemeral.allianceId),
      )
      .where(eq(schema.allianceStatic.name, name))
      .orderBy(desc(schema.allianceEphemeral.recordedAt))
      .limit(1);

    if (result.length === 0) {
      return Ok(null);
    }

    const { alliance_static, alliance_ephemeral } = result[0];
    return Ok({ ...alliance_static, ...alliance_ephemeral });
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Upserts the static data and cache headers for an alliance.
 */
export async function upsertStatic(
  values: typeof schema.allianceStatic.$inferInsert,
): Promise<Result<void, Error>> {
  try {
    await db.insert(schema.allianceStatic)
      .values(values)
      .onConflictDoUpdate({
        target: schema.allianceStatic.allianceId,
        set: values,
      });
    return Ok(void 0);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Appends a new ephemeral record to the alliance historical ledger.
 */
export async function appendEphemeral(
  values: Omit<typeof schema.allianceEphemeral.$inferInsert, 'recordId' | 'recordedAt'>,
): Promise<Result<void, Error>> {
  try {
    await db.insert(schema.allianceEphemeral).values({
      ...values,
      recordId: uuidv7(),
      recordedAt: new Date(),
    });
    return Ok(void 0);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}
