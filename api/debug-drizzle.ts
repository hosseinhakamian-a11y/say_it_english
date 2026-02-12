import { VercelRequest, VercelResponse } from '@vercel/node';
import { pool } from '../server/db';
// import { content } from '../shared/schema'; // Commented out to isolate schema issues

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log("Attempting Pool Query from server/db...");
    
    // Run a raw query using the imported pool
    const result = await pool.query('SELECT NOW()');

    return res.status(200).json({
      status: "POOL IMPORT WORKS ✅",
      message: "server/db.ts is fine, issue is likely in shared/schema.ts",
      time: result.rows[0].now
    });

  } catch (err: any) {
    console.error("Pool Error:", err);
    return res.status(500).json({
      status: "FAILED ❌",
      error_message: err.message,
      stack: err.stack
    });
  }
}
