const { drizzle } = require("drizzle-orm/node-postgres");
const { migrate } = require("drizzle-orm/node-postgres/migrator");
const { Pool } = require("pg");
require("dotenv").config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// SSL configuration - only use for production/AWS RDS
// Development: set DB_SSL_MODE=disable for local PostgreSQL without SSL
// Production: set DB_SSL_MODE=require for AWS RDS
const sslMode = process.env.DB_SSL_MODE || "prefer";

let sslConfig = false;
if (sslMode === "require") {
  sslConfig = {
    rejectUnauthorized: false,
  };
} else if (sslMode === "disable") {
  sslConfig = false;
} else if (sslMode === "prefer") {
  // Use connectionString with sslmode parameter instead
  sslConfig = "prefer";
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig === "prefer" ? false : sslConfig,
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
