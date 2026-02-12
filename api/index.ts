
import { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc, and } from "drizzle-orm";
import * as schema from "../shared/schema";

const scryptAsync = promisify(scrypt);

// ============ LAZY DB CONNECTION ============
let dbInstance: any = null;
async function getDb() {
  if (dbInstance) return dbInstance;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is missing");
  
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 10000,
  });
  dbInstance = drizzle(pool, { schema });
  return dbInstance;
}

// ============ SMS HELPER ============
function sendSMS(phone: string, message: string) {
  const apiKey = process.env.SMS_API_KEY;
  if (!apiKey) return;
  fetch("https://api.sms.ir/v1/send/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
    body: JSON.stringify({
      mobile: phone,
      templateId: parseInt(process.env.SMS_TEMPLATE_ID || "100000"),
      parameters: [{ name: "MESSAGE", value: message }]
    })
  }).catch(e => console.error("SMS Error:", e));
}

// ============ PASSWORD UTILS ============
async function comparePasswords(supplied: string, stored: string) {
  if (!stored || !stored.includes('.')) return false;
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// ============ MAIN HANDLER ============
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const db = await getDb();
    const { users, content } = schema;
    
    const method = req.method;
    const url = new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;
    const body = req.body || {};

    if (pathname === '/api/health') {
      return res.status(200).json({ status: 'ok', hasDb: !!process.env.DATABASE_URL });
    }

    // Auth logic
    const cookies = req.headers.cookie || '';
    const sessionToken = cookies.split(';').find((c) => c.trim().startsWith('session='))?.split('=')[1]?.trim();
    let currentUser = null;
    if (sessionToken) {
      [currentUser] = await db.select().from(users).where(eq(users.sessionToken, sessionToken));
    }

    if (pathname === '/api/user' && method === 'GET') {
      if (!currentUser) return res.status(401).json(null);
      const { password: _, otp: __, otpExpires: ___, ...safeUser } = currentUser;
      return res.status(200).json(safeUser);
    }

    if (pathname === '/api/auth/otp/request' && method === 'POST') {
      const { phone } = body;
      if (!phone) return res.status(400).json({ error: "شماره موبایل الزامی است" });

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

      let [user] = await db.select().from(users).where(eq(users.phone, phone));
      const ADMIN_PHONES = ["09222453571", "09123104254"];
      const isAdmin = ADMIN_PHONES.includes(phone);

      if (!user) {
        [user] = await db.insert(users).values({
          username: `user_${phone}`,
          phone,
          role: isAdmin ? "admin" : "user",
        }).returning();
      }
      
      await db.update(users).set({ 
        otp, 
        otpExpires,
        role: isAdmin && user.role !== 'admin' ? 'admin' : user.role 
      }).where(eq(users.id, user.id));

      sendSMS(phone, otp);
      return res.status(200).json({ message: "کد ارسال شد" });
    }

    if (pathname === '/api/auth/otp/verify' && method === 'POST') {
      const { phone, otp, rememberMe } = body;
      const [user] = await db.select().from(users).where(eq(users.phone, phone));
      
      if (!user || user.otp !== otp || !user.otpExpires || new Date(user.otpExpires) < new Date()) {
        return res.status(400).json({ error: "کد تایید نامعتبر یا منقضی شده است" });
      }

      const newToken = randomBytes(32).toString('hex');
      await db.update(users).set({ otp: null, otpExpires: null, sessionToken: newToken }).where(eq(users.id, user.id));

      const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
      res.setHeader('Set-Cookie', `session=${newToken}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}; Path=/`);
      
      const { password: _, otp: __, otpExpires: ___, ...safeUser } = user;
      return res.status(200).json(safeUser);
    }

    if (pathname === '/api/login' && method === 'POST') {
      const { username, password, rememberMe } = body;
      const [user] = await db.select().from(users).where(eq(users.username, username));

      if (!user || !user.password || !(await comparePasswords(password, user.password))) {
        return res.status(401).json({ error: 'اطلاعات نادرست است' });
      }

      const newToken = randomBytes(32).toString('hex');
      await db.update(users).set({ sessionToken: newToken }).where(eq(users.id, user.id));

      const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
      res.setHeader('Set-Cookie', `session=${newToken}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}; Path=/`);
      return res.status(200).json(user);
    }

    if (pathname === '/api/content' && method === 'GET') {
      const items = await db.select().from(content).orderBy(desc(content.createdAt));
      return res.status(200).json(items);
    }

    return res.status(404).json({ error: 'Not Found' });

  } catch (err: any) {
    return res.status(500).json({ error: "Server Error", message: err.message });
  }
}
