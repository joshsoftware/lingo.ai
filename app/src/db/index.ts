import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, QueryConfig, QueryResult } from 'pg';
import * as schema from './schema';
import { recordDbQueryMetric } from '@/lib/metrics';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// SSL configuration - only use for production/AWS RDS
// Development: set DB_SSL_MODE=disable for local PostgreSQL without SSL
// Production: set DB_SSL_MODE=require for AWS RDS
const sslMode = process.env.DB_SSL_MODE || 'prefer';

let sslConfig: any = false;
if (sslMode === 'require') {
  sslConfig = {
    rejectUnauthorized: false,
  };
} else if (sslMode === 'disable') {
  sslConfig = false;
} else if (sslMode === 'prefer') {
  // For prefer mode, don't set ssl to allow fallback
  sslConfig = false;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: sslConfig,
});

function extractOperation(text: string | undefined | null): string {
  if (!text) return 'UNKNOWN';
  const first = text.trim().split(/\s+/)[0]?.toUpperCase();
  if (!first) return 'UNKNOWN';
  return first;
}

const originalQuery = pool.query.bind(pool);

// Wrap pg Pool#query to record DB timings for all queries (including those via drizzle)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(pool as any).query = async (
  queryTextOrConfig: string | QueryConfig<any[]>,
  values?: any[]
): Promise<QueryResult> => {
  const start = process.hrtime.bigint();
  let success = true;
  let operation = 'UNKNOWN';

  try {
    const sqlText =
      typeof queryTextOrConfig === 'string'
        ? queryTextOrConfig
        : queryTextOrConfig?.text;
    operation = extractOperation(sqlText);

    const result = await originalQuery(queryTextOrConfig as any, values);
    return result;
  } catch (err) {
    success = false;
    throw err;
  } finally {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;

    recordDbQueryMetric({
      operation,
      success,
      duration: durationMs,
      timestamp: Date.now(),
    });
  }
};

export const db = drizzle(pool, { schema });