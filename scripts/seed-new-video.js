import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const { Pool } = pg;

// Use the NEW database URL
const connectionString = "postgresql://postgres.eomhzporbyhebawkmxyq:ManaPalm2025@aws-1-eu-north-1.pooler.supabase.com:6543/postgres";

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const db = drizzle(pool);

async function main() {
  console.log("Adding new video: I can't be bothered...");

  try {
    const result = await pool.query(`
      INSERT INTO content (
        title, 
        content_url, 
        video_id, 
        video_provider,
        description, 
        is_premium, 
        thumbnail_url,
        type,
        level,
        created_at,
        metadata
      ) VALUES (
        'I can''t be bothered - اصطلاح کاربردی',
        'https://youtube.com/shorts/tpzkWe3rEow',
        'tpzkWe3rEow',
        'youtube',
        'در این ویدیو اصطلاح I can''t be bothered را یاد می‌گیریم که یعنی حال و حوصله کاری را ندارم.',
        false,
        'https://img.youtube.com/vi/tpzkWe3rEow/hqdefault.jpg',
        'video',
        'intermediate',
        NOW(),
        '{"words": [{"word": "bothered", "meaning": "اذیت شدن", "pronunciation": "/bɒðəd/"}], "quiz": []}'
      )
      RETURNING id, title;
    `);

    console.log("✅ Success! Added video:", result.rows[0]);
  } catch (err) {
    console.error("❌ Error adding video:", err);
  } finally {
    await pool.end();
  }
}

main();
