import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL || "";

if (!connectionString) {
  console.error("DATABASE_URL is missing in environment variables!");
}

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }, // Supabase requires SSL always
  max: 1, // Limit to 1 connection per lambda instance
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Logs for connection errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const db = drizzle(pool, { schema });
