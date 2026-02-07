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
    value: any;
    updatedAt: Date;
  }>;
  queueDepth: number;
}

/**
 * Collects and returns the current system status.
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
      workers: heartbeats as any,
      queueDepth: Number(queueRows[0]?.count || 0),
    };
  });
}
