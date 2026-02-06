/**
 * Simple in-memory metrics collector.
 */
class MetricsCollector {
  private metrics = {
    esi_requests_total: 0,
    esi_errors_total: 0,
    esi_retries_total: 0,
    cache_hits_total: 0,
    cache_misses_total: 0,
    discovery_queue_processed_total: 0,
    start_time: Date.now(),
  };

  inc(name: keyof Omit<typeof this.metrics, 'start_time'>) {
    this.metrics[name]++;
  }

  getSnapshot() {
    return {
      ...this.metrics,
      uptime_seconds: Math.floor((Date.now() - this.metrics.start_time) / 1000),
    };
  }
}

export const metrics = new MetricsCollector();
