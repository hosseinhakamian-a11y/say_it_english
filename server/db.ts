import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { loadEnvFile } from "node:process";

const { Pool } = pg;

// Don't try to load env files in production (Vercel does this automatically)
if (process.env.NODE_ENV !== "production" && !process.env.DATABASE_URL) {
  console.log("Attempting to load env locally...");
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing!");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined
});
export const db = drizzle(pool, { schema });
