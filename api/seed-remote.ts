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
      ) VALUES 
      (
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
      ),
      (
        'It''s a rip-off - چطور بگیم سرم کلاه رفت؟',
        'https://youtube.com/shorts/e_zB0XfX058',
        'e_zB0XfX058',
        'youtube',
        'اصطلاح کاربردی It''s a rip-off برای زمانی استفاده می‌شود که چیزی بسیار گران‌تر از ارزش واقعی‌اش فروخته می‌شود یا به عبارتی سر آدم کلاه می‌رود.',
        false,
        'https://img.youtube.com/vi/e_zB0XfX058/hqdefault.jpg',
        'video',
        'beginner',
        NOW(),
        '{
          "words": [
            {"word": "rip-off", "meaning": "کلاهبرداری / گرانفروشی", "pronunciation": "/ˈrɪp.ɒf/"}
          ],
          "quiz": [
            {
              "question": "If something is a ''rip-off'', it is...",
              "options": ["Too cheap", "Too expensive", "A good deal", "Broken"],
              "correctAnswer": 1
            }
          ]
        }'
      ),
      (
        'تفاوت Listen و Hear در انگلیسی - اشتباه رایج',
        'https://youtube.com/watch?v=H28kK_R2-Wk',
        'H28kK_R2-Wk',
        'youtube',
        'دو فعل Listen و Hear در فارسی هر دو «شنیدن» ترجمه می‌شوند اما کاربردشان در مکالمه کاملاً متفاوت است. در این ویدیو به صورت دقیق تفاوت این دو را بررسی می‌کنیم.',
        false,
        'https://img.youtube.com/vi/H28kK_R2-Wk/hqdefault.jpg',
        'video',
        'beginner',
        NOW(),
        '{
          "words": [
            {"word": "Listen", "meaning": "گوش دادن (با دقت)", "pronunciation": "/ˈlɪs.ən/"},
            {"word": "Hear", "meaning": "شنیدن (اغلب غیرارادی)", "pronunciation": "/hɪər/"}
          ],
          "quiz": [
            {
              "question": "I ____ a loud noise outside last night.",
              "options": ["Listened", "Heard", "Listening", "Hearing"],
              "correctAnswer": 1
            }
          ]
        }'
      )
      ON CONFLICT DO NOTHING;
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
