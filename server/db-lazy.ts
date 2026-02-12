
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../shared/schema";

let dbInstance: any = null;

export async function getDb() {
  if (dbInstance) return dbInstance;

  const connectionString = process.env.DATABASE_URL;

  // In Vercel, env vars should be available. If not, this throws inside the handler,
  // which is caught by Try-Catch and returns JSON error, NOT 500 HTML.
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set in environment variables");
  }

  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    max: 1, // Highly recommended for Serverless to avoid connection exhaustion
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  dbInstance = drizzle(pool, { schema });
  return dbInstance;
}
