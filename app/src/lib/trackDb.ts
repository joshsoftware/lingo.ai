import {
  nextjsDbErrorsTotal,
  nextjsDbQueryDurationSeconds,
} from "./metrics";

export async function trackDb<T>(
  operation: string,
  model: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = process.hrtime.bigint();
  try {
    const result = await fn();
    const durationSeconds =
      Number(process.hrtime.bigint() - start) / 1e9;
    nextjsDbQueryDurationSeconds
      .labels(operation, model)
      .observe(durationSeconds);
    return result;
  } catch (error) {
    nextjsDbErrorsTotal.labels(operation, model).inc();
    throw error;
  }
}

