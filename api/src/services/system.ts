import { sql } from '../db/client.ts';
import { getLimitState } from '../clients/esi_limiter.ts';
import { metrics } from '../utils/metrics.ts';
import { wrapAsync } from '../utils/result.ts';
import { Result } from 'ts-results-es';

export interface SystemStatus {
  limiter: ReturnType<typeof getLimitState>;
  metrics: ReturnType<typeof metrics.getSnapshot>;
  workers: Array<{
    key: string;
    value: Record<string, unknown>;
    updatedAt: Date;
  }>;
  queueDepth: number;
}

/**
 * Collects and returns a snapshot of the current system status and health.
 * 
 * Aggregates information from the ESI rate limiter, internal metrics, 
 * background worker heartbeats, and discovery queue depth.
 * 
 * Performance: Medium -- DB Scan
 * Queries the `system_state` and `discovery_queue` tables.
 * 
 * @returns {Promise<Result<SystemStatus, Error>>} A result containing the system status report.
 * 
 * @example
 * const result = await getSystemStatus();
 * if (result.isOk()) {
 *   console.log(`Queue Depth: ${result.value.queueDepth}`);
 * }
 */
export async function getSystemStatus(): Promise<Result<SystemStatus, Error>> {
  return await wrapAsync(async () => {
    const limiter = getLimitState();
    const currentMetrics = metrics.getSnapshot();

    // Fetch heartbeats from system_state
    const heartbeats = await sql`
      SELECT key, value, updated_at as "updatedAt"
      FROM system_state 
      WHERE key LIKE 'heartbeat_worker_%'
    `;

    const queueRows = await sql`
      SELECT COUNT(*) as count FROM discovery_queue
    `;

    return {
      limiter,
      metrics: currentMetrics,
      // deno-lint-ignore no-explicit-any
      workers: heartbeats as any,
      queueDepth: Number(queueRows[0]?.count || 0),
    };
  });
}
