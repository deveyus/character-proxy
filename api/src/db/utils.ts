import { sql } from './client.ts';
import { wrapAsync } from '../utils/result.ts';
import { Result } from 'ts-results-es';

/**
 * Represents a contiguous range of missing EVE IDs in the local database.
 */
export interface IdGap {
  startId: number;
  endId: number;
  gapSize: number;
}

/**
 * Identifies missing ID ranges in a static entity table.
 * 
 * Uses the PostgreSQL `LEAD()` window function to calculate the gap between consecutive IDs.
 * Results are prioritized by newest (highest IDs) and smallest gap size to maximize 
 * discovery probability.
 * 
 * Performance: Medium -- DB Scan
 * Executes a full index scan on the primary key of the target table.
 * 
 * @param {'character' | 'corporation'} type - The entity space to analyze.
 * @returns {Promise<Result<IdGap[], Error>>} A list of up to 100 prioritized gaps.
 * 
 * @example
 * const result = await findEntityGaps('character');
 * if (result.isOk()) {
 *   const mostUrgentGap = result.value[0];
 *   console.log(`Missing range: ${mostUrgentGap.startId} to ${mostUrgentGap.endId}`);
 * }
 */
export async function findEntityGaps(
  type: 'character' | 'corporation',
): Promise<Result<IdGap[], Error>> {
  const tableName = type === 'character' ? 'character_static' : 'corporation_static';
  const idColumn = type === 'character' ? 'character_id' : 'corporation_id';

  return await wrapAsync(async () => {
    // We use a subquery with LEAD to find the 'next' existing ID for every row.
    // Then we filter for cases where next_id - current_id > 1.
    // The gap range is [current_id + 1, next_id - 1].
    const rows = await sql`
      SELECT 
        id + 1 as "startId",
        next_id - 1 as "endId",
        (next_id - id - 1) as "gapSize"
      FROM (
        SELECT 
          ${sql(idColumn)} as id, 
          LEAD(${sql(idColumn)}) OVER (ORDER BY ${sql(idColumn)}) as next_id 
        FROM ${sql(tableName)}
      ) t
      WHERE next_id - id > 1
      ORDER BY id DESC, "gapSize" ASC
      LIMIT 100
    `;

    return rows.map(r => ({
      startId: Number(r.startId),
      endId: Number(r.endId),
      gapSize: Number(r.gapSize),
    }));
  });
}
