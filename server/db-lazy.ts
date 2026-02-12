
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
    ssl: { rejectUnauthorized: false }, // Force SSL for Supabase/Neon in production
    max: 1,
    idleTimeoutMillis: 10000, // Close idle connections faster
    connectionTimeoutMillis: 10000, // Give more time for cold connections
  });

  dbInstance = drizzle(pool, { schema });
  return dbInstance;
}
