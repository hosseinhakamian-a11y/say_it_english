import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../server/db';
import { content } from '../shared/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log("Attempting Drizzle Query...");
    
    // Try to count content items using Drizzle
    const results = await db.select().from(content).limit(5);

    return res.status(200).json({
      status: "SUCCESS ✅",
      message: "Drizzle is working!",
      count: results.length,
      sample: results[0] ? results[0].title : "No items"
    });

  } catch (err: any) {
    console.error("Drizzle Error:", err);
    return res.status(500).json({
      status: "FAILED ❌",
      error_message: err.message,
      stack: err.stack
    });
  }
}
