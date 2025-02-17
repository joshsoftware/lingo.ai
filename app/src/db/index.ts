import { drizzle } from 'drizzle-orm/node-postgres'
import { Client } from 'pg'
import * as schema from './schema'


if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  // ssl: { rejectUnauthorized: false }
})
await client.connect()

export const db = drizzle(client, { schema })