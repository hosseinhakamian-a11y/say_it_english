import { VercelRequest, VercelResponse } from '@vercel/node';
import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, serial, text } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';

// Define a minimal schema inline to isolate from shared/schema.ts dependencies
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username'),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return res.status(500).json({ error: "No DB URL" });

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  const db = drizzle(pool);

  try {
    const result = await db.select().from(users).limit(1);
    await pool.end();
    return res.status(200).json({ status: "ISOLATED DRIZZLE WORKS", data: result });
  } catch (err: any) {
    console.error("Isolated drizzle error:", err);
    return res.status(500).json({ status: "ISOLATED FAILED", error: err.message, stack: err.stack });
  }
}
