/**
 * Simple in-memory metrics collector for application performance monitoring.
 *
 * Performance: Low -- In-Memory
 * Metrics are updated in-memory and are not persisted across application restarts.
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

  /**
   * Increments a named counter.
   *
   * @param {keyof Omit<typeof this.metrics, 'start_time'>} name - The metric key to increment.
   */
  inc(name: keyof Omit<typeof this.metrics, 'start_time'>) {
    this.metrics[name]++;
  }

  /**
   * Generates a snapshot of current system metrics and uptime.
   *
   * @returns {Object} A key-value map of metric names to current values.
   */
  getSnapshot() {
    return {
      ...this.metrics,
      uptime_seconds: Math.floor((Date.now() - this.metrics.start_time) / 1000),
    };
  }
}

/**
 * Global metrics instance.
 */
export const metrics = new MetricsCollector();
