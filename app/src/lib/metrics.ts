import client, {
  collectDefaultMetrics,
  Counter,
  Histogram,
  Registry,
} from "prom-client";

type MetricsGlobals = typeof globalThis & {
  __lingoMetricsRegistry?: Registry;
  __lingoHttpRequestsTotal?: Counter<string>;
  __lingoHttpDurationSeconds?: Histogram<string>;
  __lingoDbQueryDurationSeconds?: Histogram<string>;
  __lingoDbErrorsTotal?: Counter<string>;
  __lingoMetricsInitialized?: boolean;
};

const metricsGlobal = globalThis as MetricsGlobals;

if (!metricsGlobal.__lingoMetricsRegistry) {
  const registry = new client.Registry();

  const httpRequestsTotal = new client.Counter({
    name: "nextjs_http_requests_total",
    help: "Total number of HTTP requests handled by Next.js API routes",
    labelNames: ["method", "path", "status_code"],
    registers: [registry],
  });

  const httpDurationSeconds = new client.Histogram({
    name: "nextjs_http_duration_seconds",
    help: "HTTP request duration in seconds for Next.js API routes",
    labelNames: ["method", "path"],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    registers: [registry],
  });

  const dbQueryDurationSeconds = new client.Histogram({
    name: "nextjs_db_query_duration_seconds",
    help: "Database query duration in seconds in Next.js API routes",
    labelNames: ["operation", "model"],
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
    registers: [registry],
  });

  const dbErrorsTotal = new client.Counter({
    name: "nextjs_db_errors_total",
    help: "Total database errors in Next.js API routes",
    labelNames: ["operation", "model"],
    registers: [registry],
  });

  metricsGlobal.__lingoMetricsRegistry = registry;
  metricsGlobal.__lingoHttpRequestsTotal = httpRequestsTotal;
  metricsGlobal.__lingoHttpDurationSeconds = httpDurationSeconds;
  metricsGlobal.__lingoDbQueryDurationSeconds = dbQueryDurationSeconds;
  metricsGlobal.__lingoDbErrorsTotal = dbErrorsTotal;
}

if (!metricsGlobal.__lingoMetricsInitialized) {
  collectDefaultMetrics({ register: metricsGlobal.__lingoMetricsRegistry! });
  metricsGlobal.__lingoMetricsInitialized = true;
}

export const registry = metricsGlobal.__lingoMetricsRegistry!;

export const nextjsHttpRequestsTotal =
  metricsGlobal.__lingoHttpRequestsTotal!;

export const nextjsHttpDurationSeconds =
  metricsGlobal.__lingoHttpDurationSeconds!;

export const nextjsDbQueryDurationSeconds =
  metricsGlobal.__lingoDbQueryDurationSeconds!;

export const nextjsDbErrorsTotal = metricsGlobal.__lingoDbErrorsTotal!;

export function withHttpMetrics(
  name: string,
  handler: (req: Request) => Promise<Response>
) {
  return async function wrappedHandler(req: Request): Promise<Response> {
    const method = req.method;
    const path = name;
    const start = process.hrtime.bigint();

    try {
      const res = await handler(req);
      const statusCode = res.status.toString();

      nextjsHttpRequestsTotal
        .labels(method, path, statusCode)
        .inc();

      const durationSeconds =
        Number(process.hrtime.bigint() - start) / 1e9;

      nextjsHttpDurationSeconds.labels(method, path).observe(durationSeconds);

      return res;
    } catch (err) {
      nextjsHttpRequestsTotal
        .labels(method, path, "500")
        .inc();

      const durationSeconds =
        Number(process.hrtime.bigint() - start) / 1e9;

      nextjsHttpDurationSeconds.labels(method, path).observe(durationSeconds);

      throw err;
    }
  };
}

