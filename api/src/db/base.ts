import { db } from './client.ts';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { desc, eq } from 'drizzle-orm';
import { PgColumn, PgTableWithColumns } from 'drizzle-orm/pg-core';
import { Result } from 'ts-results-es';
import { uuidv7 } from 'uuidv7';
import { wrapAsync } from '../utils/result.ts';
import * as schema from './schema.ts';

export type Tx = PostgresJsDatabase<typeof schema>;

/**
 * Generic configuration for an entity type.
 */
export interface EntityConfig<
  // deno-lint-ignore no-explicit-any
  TStatic extends PgTableWithColumns<any>,
  // deno-lint-ignore no-explicit-any
  TEphemeral extends PgTableWithColumns<any>,
> {
  staticTable: TStatic;
  ephemeralTable: TEphemeral;
  // deno-lint-ignore no-explicit-any
  idColumn: (table: TStatic | TEphemeral) => PgColumn<any>;
  // deno-lint-ignore no-explicit-any
  nameColumn?: (table: TStatic) => PgColumn<any>;
}

/**
 * Resolves an entity by its EVE ID using generic join logic.
 */
export async function resolveEntityById<
  // deno-lint-ignore no-explicit-any
  TStatic extends PgTableWithColumns<any>,
  // deno-lint-ignore no-explicit-any
  TEphemeral extends PgTableWithColumns<any>,
>(
  config: EntityConfig<TStatic, TEphemeral>,
  id: number,
): Promise<Result<(TStatic['$inferSelect'] & TEphemeral['$inferSelect']) | null, Error>> {
  return await wrapAsync(async () => {
    const result = await db
      .select()
      // deno-lint-ignore no-explicit-any
      .from(config.staticTable as any)
      .innerJoin(
        // deno-lint-ignore no-explicit-any
        config.ephemeralTable as any,
        eq(config.idColumn(config.staticTable), config.idColumn(config.ephemeralTable)),
      )
      .where(eq(config.idColumn(config.staticTable), id))
      // deno-lint-ignore no-explicit-any
      .orderBy(desc((config.ephemeralTable as any).recordedAt))
      .limit(1);

    if (result.length === 0) return null;

    // Flatten the joined result
    const keys = Object.keys(result[0]);
    // deno-lint-ignore no-explicit-any
    const row = result[0] as any;
    return { ...row[keys[0]], ...row[keys[1]] };
  });
}

/**
 * Resolves an entity by its name.
 */
export async function resolveEntityByName<
  // deno-lint-ignore no-explicit-any
  TStatic extends PgTableWithColumns<any>,
  // deno-lint-ignore no-explicit-any
  TEphemeral extends PgTableWithColumns<any>,
>(
  config: EntityConfig<TStatic, TEphemeral>,
  name: string,
): Promise<Result<(TStatic['$inferSelect'] & TEphemeral['$inferSelect']) | null, Error>> {
  return await wrapAsync(async () => {
    if (!config.nameColumn) throw new Error('Entity does not support name lookup');

    const result = await db
      .select()
      // deno-lint-ignore no-explicit-any
      .from(config.staticTable as any)
      .innerJoin(
        // deno-lint-ignore no-explicit-any
        config.ephemeralTable as any,
        eq(config.idColumn(config.staticTable), config.idColumn(config.ephemeralTable)),
      )
      .where(eq(config.nameColumn(config.staticTable), name))
      // deno-lint-ignore no-explicit-any
      .orderBy(desc((config.ephemeralTable as any).recordedAt))
      .limit(1);

    if (result.length === 0) return null;

    const keys = Object.keys(result[0]);
    // deno-lint-ignore no-explicit-any
    const row = result[0] as any;
    return { ...row[keys[0]], ...row[keys[1]] };
  });
}

/**
 * Generic transactional upsert for static data.
 */
// deno-lint-ignore no-explicit-any
export async function upsertStaticEntity<TStatic extends PgTableWithColumns<any>>(
  table: TStatic,
  // deno-lint-ignore no-explicit-any
  idColumn: PgColumn<any>,
  values: TStatic['$inferInsert'],
  tx: Tx = db,
): Promise<Result<void, Error>> {
  return await wrapAsync(async () => {
    await tx.insert(table)
      .values(values)
      .onConflictDoUpdate({
        target: idColumn,
        set: values,
      });
  });
}

/**
 * Generic transactional append for ephemeral data.
 */
// deno-lint-ignore no-explicit-any
export async function appendEphemeralEntity<TEphemeral extends PgTableWithColumns<any>>(
  table: TEphemeral,
  values: Omit<TEphemeral['$inferInsert'], 'recordId' | 'recordedAt'>,
  tx: Tx = db,
): Promise<Result<void, Error>> {
  return await wrapAsync(async () => {
    await tx.insert(table).values({
      ...values,
      recordId: uuidv7(),
      recordedAt: new Date(),
      // deno-lint-ignore no-explicit-any
    } as any);
  });
}
