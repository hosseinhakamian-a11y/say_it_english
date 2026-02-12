import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    return res.status(500).json({ error: "DATABASE_URL is not defined in env vars" });
  }

  // Hide password for safety in output
  const safeUrl = connectionString.replace(/:([^:@]+)@/, ":****@");

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }, // Critical for Supabase
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT version();');
    const tableCheck = await client.query("SELECT count(*) FROM users;");
    
    client.release();
    await pool.end();

    return res.status(200).json({
      status: "SUCCESS ✅",
      url_used: safeUrl,
      db_version: result.rows[0].version,
      users_count: tableCheck.rows[0].count
    });

  } catch (err: any) {
    return res.status(500).json({
      status: "FAILED ❌",
      url_used: safeUrl,
      error_message: err.message,
      error_code: err.code,
      error_detail: err.detail
    });
  }
}
