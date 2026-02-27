import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'


if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // max 10 connections
  idleTimeoutMillis: 30000, // idle connections are closed after 30s
  connectionTimeoutMillis: 2000, // wait 2s for a connection before failing
  ssl: {
    // AWS RDS requires SSL but uses self-signed certificates
    // This keeps encryption enabled while accepting AWS certificates
    rejectUnauthorized: false,
  },
})

export const db = drizzle(pool, { schema })