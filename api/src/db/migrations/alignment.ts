import { sql } from '../client.ts';
import { z } from 'zod';
import { Err, Ok, Result } from 'ts-results-es';
import { logger } from '../../utils/logger.ts';
import { CharacterEntitySchema } from '../character.ts';
import { CorporationEntitySchema } from '../corporation.ts';
import { AllianceEntitySchema } from '../alliance.ts';

/**
 * Extracts keys from a Zod object or intersection.
 */
function getZodKeys(schema: z.ZodTypeAny): string[] {
  if (schema instanceof z.ZodObject) {
    return Object.keys(schema.shape);
  }
  if (schema instanceof z.ZodIntersection) {
    return [...getZodKeys(schema._def.left), ...getZodKeys(schema._def.right)];
  }
  if (schema instanceof z.ZodEffects) {
    return getZodKeys(schema._def.schema);
  }
  return [];
}

/**
 * Validates that the database table structure matches a given Zod schema.
 */
async function validateTableSchema(tableName: string, schema: z.ZodTypeAny): Promise<Result<void, Error>> {
  try {
    // We query one row (or zero) to get the column names returned by the driver
    const rows = await sql`SELECT * FROM ${sql(tableName)} LIMIT 0`;
    const dbColumns = rows.columns.map(c => c.name);
    
    // Get keys from Zod schema
    const schemaKeys = [...new Set(getZodKeys(schema))];
    
    // We check if all schema keys exist in the database.
    // Note: Database might have more columns (e.g. internal PG columns), 
    // but our application layer must find everything it expects.
    const missingInDb = schemaKeys.filter(k => !dbColumns.includes(k) && !dbColumns.includes(k.toLowerCase()));
    
    if (missingInDb.length > 0) {
      return Err(new Error(`Table '${tableName}' is missing columns expected by Zod schema: ${missingInDb.join(', ')}`));
    }

    return Ok(void 0);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Runs alignment checks for all core entities.
 */
export async function runAlignmentGuards(): Promise<Result<void, Error>> {
  logger.info('DB', 'Running Zod alignment guards...');

  // Note: We check against the _static tables where the primary entity lives.
  // The alignment guard ensures that the base columns we expect are there.
  const checks = [
    { name: 'character_static', schema: CharacterEntitySchema },
    { name: 'corporation_static', schema: CorporationEntitySchema },
    { name: 'alliance_static', schema: AllianceEntitySchema },
  ];

  for (const check of checks) {
    const result = await validateTableSchema(check.name, check.schema);
    if (result.isErr()) {
      logger.error('DB', `Alignment check failed for ${check.name}: ${result.error.message}`);
      return result;
    }
  }

  logger.info('DB', 'All Zod alignment guards passed.');
  return Ok(void 0);
}