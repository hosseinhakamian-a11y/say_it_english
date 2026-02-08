import type { VercelRequest, VercelResponse } from '@vercel.node';
import pg from 'pg';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ============ DATABASE SETUP ============
const { Pool } = pg;
let pool: any = null;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL not configured");
    pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

// ============ ARVAN CLOUD HELPERS ============
function getS3Config() {
  return { 
    client: new S3Client({
      region: "default",
      endpoint: process.env.ARVAN_ENDPOINT,
      credentials: { 
        accessKeyId: process.env.ARVAN_ACCESS_KEY!, 
        secretAccessKey: process.env.ARVAN_SECRET_KEY! 
      },
      forcePathStyle: true,
    }),
    bucket: process.env.ARVAN_BUCKET_NAME 
  };
}

async function generateUploadLink(fileKey: string, contentType: string) {
  try {
    const { client, bucket } = getS3Config();
    const command = new PutObjectCommand({ Bucket: bucket, Key: fileKey, ContentType: contentType });
    return await getSignedUrl(client, command, { expiresIn: 3600 });
  } catch (e) { return null; }
}

// ============ MAIN HANDLER ============
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = req.url || '';
  const method = req.method || 'GET';
  const db = getPool();

  // CORS
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (method === 'OPTIONS') return res.status(200).end();

  // AUTH CHECK
  const cookies = req.headers.cookie || '';
  const sessionToken = cookies.split(';').find(c => c.trim().startsWith('session='))?.split('=')[1];
  let currentUser: any = null;
  if (sessionToken) {
    const userRes = await db.query('SELECT * FROM users WHERE session_token = $1', [sessionToken]);
    if (userRes.rows.length > 0) currentUser = userRes.rows[0];
  }

  // ---- API ROUTES ----

  // 1. Content CRUD
  if (url === '/api/content' || url.startsWith('/api/content/')) {
    if (method === 'GET' && url === '/api/content') {
      const result = await db.query('SELECT * FROM content ORDER BY id DESC');
      return res.status(200).json(result.rows);
    }

    if (method === 'POST') {
      if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
      const { title, description, type, level, videoId, videoProvider, fileKey, isPremium, price } = req.body;
      
      // اصلاح نام فیلدها مطابق با خروجی Drizzle (snake_case در دیتابیس PostgreSQL معمولاً به camelCase تبدیل می‌شود اما اینجا مستقیم SQL می‌زنیم)
      const query = `
        INSERT INTO content (title, description, type, level, video_id, video_provider, file_key, is_premium, price)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      const values = [title, description || '', type || 'video', level || 'beginner', videoId || '', videoProvider || 'custom', fileKey || '', !!isPremium, price || 0];
      const result = await db.query(query, values);
      return res.status(201).json(result.rows[0]);
    }

    if (method === 'DELETE') {
      if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
      const id = url.split('/').pop();
      await db.query('DELETE FROM content WHERE id = $1', [id]);
      return res.status(200).json({ success: true });
    }
  }

  // 2. Admin Stats
  if (url === '/api/admin/stats') {
    if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
    const u = await db.query('SELECT COUNT(*) FROM users');
    const c = await db.query('SELECT COUNT(*) FROM content');
    const p = await db.query('SELECT COUNT(*) FROM payments');
    return res.status(200).json({ users: parseInt(u.rows[0].count), content: parseInt(c.rows[0].count), payments: parseInt(p.rows[0].count) });
  }

  // 3. Arvan Upload Link
  if (url.includes('/api/content/upload-link')) {
    const fileName = new URL(url, `https://${req.headers.host}`).searchParams.get('fileName');
    const contentType = new URL(url, `https://${req.headers.host}`).searchParams.get('contentType');
    const fileKey = `uploads/${Date.now()}-${fileName}`;
    const uploadUrl = await generateUploadLink(fileKey, contentType || 'video/mp4');
    return res.status(200).json({ uploadUrl, fileKey });
  }

  // 4. Current User
  if (url === '/api/user') return res.status(200).json(currentUser || null);

  return res.status(404).json({ error: "Not Found" });
}
