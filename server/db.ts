import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL || "";

if (!connectionString) {
  throw new Error("DATABASE_URL is missing in environment variables!");
}

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }, 
  max: 3, // slightly relaxed for better throughput
  connectionTimeoutMillis: 10000, // increased timeout
});

// Logs for connection errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const db = drizzle(pool, { schema });
