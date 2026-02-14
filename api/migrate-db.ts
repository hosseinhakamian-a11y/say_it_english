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
    
    // Just in case these are missing too
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'beginner';`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;`);

    return res.status(200).json({ message: "Migration successful! Columns added: streak, bio, last_seen_at, level, avatar." });

  } catch (err: any) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  } finally {
    client.release();
  }
}
