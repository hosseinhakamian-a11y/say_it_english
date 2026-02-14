import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

// Isolated pool for migration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const client = await pool.connect();
  try {
    console.log("Migrating DB schema...");
    
    // Add new columns required for dashboard
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP;`);
    
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date TEXT;`);

    // Create payments and purchases tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        content_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        tracking_code TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        content_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    return res.status(200).json({ message: "Migration successful! Columns added and tables (payments, purchases) created." });

  } catch (err: any) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  } finally {
    client.release();
  }
}
