const { drizzle } = require("drizzle-orm/node-postgres");
const { migrate } = require("drizzle-orm/node-postgres/migrator");
const { Pool } = require("pg");
require("dotenv").config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// SSL configuration for AWS RDS
const sslConfig = {
  // AWS RDS requires SSL but uses self-signed certificates
  // This keeps encryption enabled while accepting AWS certificates
  rejectUnauthorized: false,
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
});

const db = drizzle(pool);

async function runMigrations() {
  try {
    console.log("Running migrations...");
    await migrate(db, { migrationsFolder: "./migrations" });
    console.log("Migrations completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
