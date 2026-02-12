import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

// Create a local isolated pool to avoid any dependency issues with server/db.ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1, // Minimize connections for this administrative task
  connectionTimeoutMillis: 10000,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = await pool.connect();
  
  try {
    console.log("Starting remote seed...");
    
    // 1. Create Table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS content (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        level TEXT NOT NULL,
        content_url TEXT,
        video_id TEXT,
        video_provider TEXT,
        arvan_video_id TEXT,
        arvan_video_provider TEXT,
        file_key TEXT,
        is_premium BOOLEAN DEFAULT FALSE,
        price INTEGER DEFAULT 0,
        thumbnail_url TEXT,
        body TEXT,
        slug TEXT UNIQUE,
        author TEXT,
        tags TEXT[],
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Table 'content' ensured.");

    // 2. Check overlap
    const check = await client.query("SELECT count(*) FROM content WHERE video_id = $1", ['tpzkWe3rEow']);
    if (parseInt(check.rows[0].count) > 0) {
      console.log("Content already exists.");
      return res.status(200).json({ message: "Content already exists, skipping insert." });
    }

    // 3. Insert Data
    await client.query(`
      INSERT INTO content (
        title, content_url, video_id, video_provider, description, is_premium, thumbnail_url, type, level, created_at, metadata
      ) VALUES (
        'I can''t be bothered - اصطلاح کاربردی',
        'https://youtube.com/shorts/tpzkWe3rEow',
        'tpzkWe3rEow',
        'youtube',
        'در این ویدیو اصطلاح I can''t be bothered را یاد می‌گیریم که یعنی حال و حوصله کاری را ندارم.',
        false,
        'https://img.youtube.com/vi/tpzkWe3rEow/hqdefault.jpg',
        'video',
        'beginner',
        NOW(),
        '{
          "words": [
            {"word": "bothered", "meaning": "اذیت شدن / زحمت کشیدن", "pronunciation": "/ˈbɒðəd/"},
            {"word": "mood", "meaning": "حال و حوصله", "pronunciation": "/muːd/"}
          ],
          "quiz": [
            {
              "question": "What does ''I can''t be bothered'' mean?",
              "options": ["I cannot do it", "I am busy", "I don''t feel like doing it", "It is impossible"],
              "correctAnswer": 2
            }
          ]
        }'
      )
    `);
    console.log("Data inserted.");

    return res.status(200).json({ message: "Database seeded successfully!" });

  } catch (err: any) {
    console.error("Seed error:", err);
    return res.status(500).json({ error: err.message, stack: err.stack });
  } finally {
    client.release();
  }
}
