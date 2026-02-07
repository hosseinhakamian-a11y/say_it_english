import type { VercelRequest, VercelResponse } from '@vercel.node';
import axios from 'axios';
import pg from 'pg';
import crypto, { scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const scryptAsync = promisify(scrypt);

// ============ DATABASE SETUP ============
const { Pool } = pg;
let pool: any = null;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL not configured");
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

// ============ ARVAN CLOUD / S3 HELPERS ============
function getS3Config() {
  const endpoint = process.env.ARVAN_ENDPOINT;
  const accessKeyId = process.env.ARVAN_ACCESS_KEY;
  const secretAccessKey = process.env.ARVAN_SECRET_KEY;
  const bucket = process.env.ARVAN_BUCKET_NAME;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("Missing ArvanCloud S3 Configuration");
  }

  return { 
    client: new S3Client({
      region: "default",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    }),
    bucket 
  };
}

async function generateDownloadLink(fileKey: string, expiresInSeconds = 3600, disposition: "attachment" | "inline" = "attachment") {
  try {
    const { client, bucket } = getS3Config();
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      ResponseContentDisposition: disposition,
    });
    return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  } catch (error) {
    console.error("Download link error:", error);
    return null;
  }
}

async function generateUploadLink(fileKey: string, contentType: string, expiresInSeconds = 3600) {
  try {
    const { client, bucket } = getS3Config();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      ContentType: contentType,
    });
    return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  } catch (error) {
    console.error("Upload link error:", error);
    return null;
  }
}

// ============ AUTH HELPERS ============
async function comparePasswords(supplied: string, stored: string) {
  try {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) return false;
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (e) { return false; }
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) cookies[name] = value;
  });
  return cookies;
}

// ============ MAIN HANDLER ============
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = req.url || '';
  const method = req.method || 'GET';
  const db = getPool();

  // CORS
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (method === 'OPTIONS') return res.status(200).end();

  // AUTH CHECK (Session Token)
  const cookies = parseCookies(req.headers.cookie);
  const sessionToken = cookies['session'];
  let currentUser: any = null;
  if (sessionToken) {
    const userResult = await db.query('SELECT * FROM users WHERE session_token = $1', [sessionToken]);
    if (userResult.rows.length > 0) currentUser = userResult.rows[0];
  }

  // ---- 1. Admin Stats (FIXING 404) ----
  if (url.includes('/api/admin/stats')) {
    if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
    const userCount = await db.query('SELECT COUNT(*) FROM users');
    const contentCount = await db.query('SELECT COUNT(*) FROM content');
    const paymentCount = await db.query('SELECT COUNT(*) FROM payments');
    return res.status(200).json({
      users: parseInt(userCount.rows[0].count),
      content: parseInt(contentCount.rows[0].count),
      payments: parseInt(paymentCount.rows[0].count)
    });
  }

  // ---- 2. Bookings (FIXING 404) ----
  if (url.includes('/api/bookings')) {
    if (!currentUser) return res.status(401).json({ error: "Unauthorized" });
    if (method === 'GET') {
      const bookings = await db.query('SELECT * FROM bookings WHERE user_id = $1', [currentUser.id]);
      return res.status(200).json(bookings.rows);
    }
  }

  // ---- 3. Content List ----
  if (url.includes('/api/content') && method === 'GET' && !url.includes('upload-link')) {
    const content = await db.query('SELECT * FROM content');
    return res.status(200).json(content.rows);
  }

  // ---- 4. ArvanCloud Upload Link ----
  if (url.includes('/api/content/upload-link')) {
    if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
    const urlObj = new URL(url, `https://${req.headers.host}`);
    const fileName = urlObj.searchParams.get('fileName');
    const contentType = urlObj.searchParams.get('contentType');
    if (!fileName || !contentType) return res.status(400).json({ error: "Missing parameters" });
    
    const fileKey = `uploads/${Date.now()}-${fileName}`;
    const uploadUrl = await generateUploadLink(fileKey, contentType);
    return res.status(200).json({ uploadUrl, fileKey });
  }

  // ---- 5. Auth / Login / User ----
  if (url.includes('/api/user') && method === 'GET') {
    return res.status(200).json(currentUser || null);
  }

  // Fallback to 404
  return res.status(404).json({ error: "Endpoint not found", path: url });
}
