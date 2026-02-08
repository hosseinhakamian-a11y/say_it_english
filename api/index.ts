import type { VercelRequest, VercelResponse } from '@vercel/node';
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

// ============ HELPERS ============
// Convert snake_case database fields to camelCase for frontend
function mapContentRow(row: any) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    level: row.level,
    contentUrl: row.content_url,
    videoId: row.video_id,
    videoProvider: row.video_provider,
    fileKey: row.file_key,
    isPremium: row.is_premium,
    price: row.price,
    thumbnailUrl: row.thumbnail_url,
    createdAt: row.created_at,
  };
}

// ============ ARVAN CLOUD HELPERS ============
async function generateUploadLink(fileKey: string, contentType: string) {
  try {
    const client = new S3Client({
      region: "default",
      endpoint: process.env.ARVAN_ENDPOINT!,
      credentials: { 
        accessKeyId: process.env.ARVAN_ACCESS_KEY!, 
        secretAccessKey: process.env.ARVAN_SECRET_KEY! 
      },
      forcePathStyle: true,
    });
    const command = new PutObjectCommand({ Bucket: process.env.ARVAN_BUCKET_NAME!, Key: fileKey, ContentType: contentType });
    return await getSignedUrl(client, command, { expiresIn: 3600 });
  } catch (e) { return null; }
}

// ============ MAIN HANDLER ============
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method || 'GET';
  const db = getPool();
  
  const fullUrl = req.url || '';
  const pathname = fullUrl.split('?')[0];

  // CORS Settings
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (method === 'OPTIONS') return res.status(200).end();

  try {
    // AUTH CHECK
    const cookies = req.headers.cookie || '';
    const sessionToken = cookies.split(';').find((c: string) => c.trim().startsWith('session='))?.split('=')[1];
    let currentUser: any = null;
    if (sessionToken) {
      const userRes = await db.query('SELECT * FROM users WHERE session_token = $1', [sessionToken]);
      if (userRes.rows.length > 0) currentUser = userRes.rows[0];
    }

    // ---- ROUTES ----

    // 1. Content CRUD
    if (pathname === '/api/content') {
      if (method === 'GET') {
        const result = await db.query('SELECT * FROM content ORDER BY id DESC');
        // تبدیل فیلدها به camelCase برای فرانت‌اند
        const mappedContent = result.rows.map(mapContentRow);
        return res.status(200).json(mappedContent);
      }

      if (method === 'POST') {
        if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
        const { title, description, type, level, videoId, videoProvider, fileKey, isPremium, price } = req.body;
        
        const query = `
          INSERT INTO content (title, description, type, level, video_id, video_provider, file_key, is_premium, price)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `;
        const values = [
          title || 'Untitled', 
          description || '', 
          type || 'video', 
          level || 'beginner', 
          videoId || '', 
          videoProvider || 'custom', 
          fileKey || '', 
          !!isPremium, 
          parseInt(price) || 0
        ];
        const result = await db.query(query, values);
        return res.status(201).json(mapContentRow(result.rows[0]));
      }
    }

    // 2. Specialized Content Actions
    if (pathname.includes('/api/content/')) {
      const id = pathname.split('/').pop();
      if (method === 'DELETE') {
        if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
        await db.query('DELETE FROM content WHERE id = $1', [id]);
        return res.status(200).json({ success: true });
      }
    }

    // 3. Admin / Stats
    if (pathname.includes('/api/admin/stats')) {
      if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
      const [u, c, p] = await Promise.all([
        db.query('SELECT COUNT(*) FROM users'),
        db.query('SELECT COUNT(*) FROM content'),
        db.query('SELECT COUNT(*) FROM payments')
      ]);
      return res.status(200).json({ users: u.rows[0].count, content: c.rows[0].count, payments: p.rows[0].count });
    }

    // 4. Arvan Upload Link
    if (pathname.includes('/upload-link')) {
      const urlObj = new URL(fullUrl, `https://${req.headers.host}`);
      const fileName = urlObj.searchParams.get('fileName') || 'file';
      const contentType = urlObj.searchParams.get('contentType') || 'video/mp4';
      const fileKey = `uploads/${Date.now()}-${fileName}`;
      const uploadUrl = await generateUploadLink(fileKey, contentType);
      return res.status(200).json({ uploadUrl, fileKey });
    }

    // 5. User Status
    if (pathname === '/api/user') return res.status(200).json(currentUser || null);

    return res.status(404).json({ error: "Endpoint not found", path: pathname });

  } catch (error: any) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
}
