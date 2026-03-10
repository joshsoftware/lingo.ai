/**
 * Frontend Metrics Tracking
 * Collects metrics for Next.js API routes and sends them to an in-memory store
 */

export interface ApiMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number; // in milliseconds
  timestamp: number;
  requestId: string;
  userId?: string;
  error?: string;
}

export interface DbQueryMetric {
  operation: string;
  success: boolean;
  duration: number; // in milliseconds
  timestamp: number;
}

class MetricsCollector {
  private metrics: ApiMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics
  private dbMetrics: DbQueryMetric[] = [];
  private maxDbMetrics = 2000;

  /**
   * Record an API metric
   */
  recordMetric(metric: ApiMetric) {
    this.metrics.push(metric);

    // Keep only the last N metrics to avoid memory bloat
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Record a DB query metric
   */
  recordDbMetric(metric: DbQueryMetric) {
    this.dbMetrics.push(metric);

    if (this.dbMetrics.length > this.maxDbMetrics) {
      this.dbMetrics = this.dbMetrics.slice(-this.maxDbMetrics);
    }
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): ApiMetric[] {
    return this.metrics;
  }

  /**
   * Get metrics summary
   */
  getSummary() {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        uniqueEndpoints: 0,
        averageResponseTime: 0,
        errorRate: 0,
        statusCodes: {},
        endpointStats: {},
      };
    }

    const statusCodes: Record<number, number> = {};
    const endpointStats: Record<
      string,
      { count: number; totalDuration: number; errors: number }
    > = {};
    let totalDuration = 0;
    let errorCount = 0;

    this.metrics.forEach((metric) => {
      // Track status codes
      statusCodes[metric.statusCode] =
        (statusCodes[metric.statusCode] || 0) + 1;

      // Track endpoint stats
      if (!endpointStats[metric.endpoint]) {
        endpointStats[metric.endpoint] = {
          count: 0,
          totalDuration: 0,
          errors: 0,
        };
      }
      endpointStats[metric.endpoint].count++;
      endpointStats[metric.endpoint].totalDuration += metric.duration;

      // Count errors
      if (metric.statusCode >= 400) {
        errorCount++;
        endpointStats[metric.endpoint].errors++;
      }

      totalDuration += metric.duration;
    });

    const averageResponseTime = Math.round(
      totalDuration / this.metrics.length
    );
    const errorRate = Math.round((errorCount / this.metrics.length) * 100);

    return {
      totalRequests: this.metrics.length,
      uniqueEndpoints: Object.keys(endpointStats).length,
      averageResponseTime,
      errorRate,
      statusCodes,
      endpointStats: Object.entries(endpointStats).map(
        ([endpoint, stats]) => ({
          endpoint,
          count: stats.count,
          averageDuration: Math.round(stats.totalDuration / stats.count),
          errorCount: stats.errors,
        })
      ),
    };
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
  }

  /**
   * Export metrics as Prometheus-compatible format
   */
  exportAsPrometheus(): string {
    let output = '';

    // Request count by endpoint and status
    output += '# HELP lingo_frontend_requests_total Total API requests\n';
    output += '# TYPE lingo_frontend_requests_total counter\n';

    const endpointStatusMap: Record<string, Record<number, number>> = {};
    this.metrics.forEach((metric) => {
      if (!endpointStatusMap[metric.endpoint]) {
        endpointStatusMap[metric.endpoint] = {};
      }
      endpointStatusMap[metric.endpoint][metric.statusCode] =
        (endpointStatusMap[metric.endpoint][metric.statusCode] || 0) + 1;
    });

    Object.entries(endpointStatusMap).forEach(([endpoint, statuses]) => {
      Object.entries(statuses).forEach(([status, count]) => {
        output += `lingo_frontend_requests_total{endpoint="${endpoint}",method="*",status="${status}"} ${count}\n`;
      });
    });

    // Response time histogram
    output += '# HELP lingo_frontend_request_duration_seconds Request duration\n';
    output += '# TYPE lingo_frontend_request_duration_seconds histogram\n';

    const durations = this.metrics.map((m) => m.duration / 1000); // Convert to seconds
    const buckets = [0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5];

    this.metrics.forEach((metric) => {
      const durationSeconds = metric.duration / 1000;
      output += `lingo_frontend_request_duration_seconds_sum{endpoint="${metric.endpoint}",method="*"} ${durations.reduce((a, b) => a + b, 0)}\n`;

      buckets.forEach((bucket) => {
        const count = durations.filter((d) => d <= bucket).length;
        output += `lingo_frontend_request_duration_seconds_bucket{endpoint="${metric.endpoint}",le="${bucket}",method="*"} ${count}\n`;
      });
    });

    output += `lingo_frontend_request_duration_seconds_bucket{endpoint="*",le="+Inf",method="*"} ${this.metrics.length}\n`;
    output += `lingo_frontend_request_duration_seconds_count{endpoint="*",method="*"} ${this.metrics.length}\n`;

    // DB query metrics
    output += '# HELP lingo_frontend_db_queries_total Total DB queries from frontend\n';
    output += '# TYPE lingo_frontend_db_queries_total counter\n';

    const dbCountByOpAndSuccess: Record<string, Record<string, number>> = {};
    this.dbMetrics.forEach((m) => {
      const op = m.operation || 'UNKNOWN';
      const successKey = m.success ? 'true' : 'false';
      if (!dbCountByOpAndSuccess[op]) {
        dbCountByOpAndSuccess[op] = {};
      }
      dbCountByOpAndSuccess[op][successKey] =
        (dbCountByOpAndSuccess[op][successKey] || 0) + 1;
    });

    Object.entries(dbCountByOpAndSuccess).forEach(([operation, bySuccess]) => {
      Object.entries(bySuccess).forEach(([success, count]) => {
        output += `lingo_frontend_db_queries_total{operation="${operation}",success="${success}"} ${count}\n`;
      });
    });

    // Simple DB query duration histogram (no labels other than operation)
    output += '# HELP lingo_frontend_db_query_duration_seconds DB query duration\n';
    output += '# TYPE lingo_frontend_db_query_duration_seconds histogram\n';

    const dbDurationsSeconds = this.dbMetrics.map((m) => m.duration / 1000);
    const dbBuckets = [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1];

    const bucketCounts: Record<number | 'Inf', number> = {};
    dbBuckets.forEach((b) => (bucketCounts[b] = 0));
    bucketCounts['Inf'] = 0;

    dbDurationsSeconds.forEach((d) => {
      let placed = false;
      for (const b of dbBuckets) {
        if (d <= b) {
          bucketCounts[b] = (bucketCounts[b] || 0) + 1;
          placed = true;
          break;
        }
      }
      if (!placed) {
        bucketCounts['Inf'] = (bucketCounts['Inf'] || 0) + 1;
      }
    });

    dbBuckets.forEach((b) => {
      output += `lingo_frontend_db_query_duration_seconds_bucket{le="${b}"} ${bucketCounts[b] || 0}\n`;
    });
    output += `lingo_frontend_db_query_duration_seconds_bucket{le="+Inf"} ${bucketCounts['Inf'] || 0}\n`;
    const dbSum = dbDurationsSeconds.reduce((a, b) => a + b, 0);
    output += `lingo_frontend_db_query_duration_seconds_sum ${dbSum}\n`;
    output += `lingo_frontend_db_query_duration_seconds_count ${this.dbMetrics.length}\n`;

    return output;
  }
}

// Global singleton instance
export const metricsCollector = new MetricsCollector();

/**
 * Helper function to record API metrics from route handlers
 */
export function createMetricsRecorder(endpoint: string, method: string) {
  return {
    start() {
      const startTime = Date.now();
      const requestId = Math.random().toString(36).substring(7);

      return {
        end(statusCode: number, userId?: string, error?: string) {
          const duration = Date.now() - startTime;

          metricsCollector.recordMetric({
            endpoint,
            method,
            statusCode,
            duration,
            timestamp: Date.now(),
            requestId,
            userId,
            error,
          });
        },
      };
    },
  };
}

export function recordDbQueryMetric(metric: DbQueryMetric) {
  metricsCollector.recordDbMetric(metric);
}
