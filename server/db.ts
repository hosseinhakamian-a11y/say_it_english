import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { loadEnvFile } from "node:process";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.log("No DATABASE_URL found in environment, attempting to load from .env files...");
  try {
    loadEnvFile(".env.local");
    console.log(".env.local loaded successfully");
  } catch (e) {
    try {
      loadEnvFile(".env");
      console.log(".env loaded successfully");
    } catch (e2) {
      console.log("No .env or .env.local file found or failed to load");
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error("CRITICAL: DATABASE_URL is still missing after check!");
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
} else {
  console.log("DATABASE_URL is set (starts with: " + process.env.DATABASE_URL.substring(0, 15) + "...)");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined
});
export const db = drizzle(pool, { schema });
