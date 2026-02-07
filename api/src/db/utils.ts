import { sql } from './client.ts';
import { wrapAsync } from '../utils/result.ts';
import { Result } from 'ts-results-es';

export interface IdGap {
  startId: number;
  endId: number;
  gapSize: number;
}

/**
 * Finds gaps in the ID sequence of a given static table.
 * Uses LEAD() window function to find the next ID and identify ranges where the difference > 1.
 * Returns gaps sorted by newest (highest IDs) and smallest gap size.
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
