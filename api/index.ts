
import { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { eq, desc } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

// ============ LOCAL SCHEMA DEFINITION ============
const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  phone: text("phone").unique(),
  password: text("password"),
  role: text("role").default("user"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  avatar: text("avatar"),
  level: text("level").default("beginner"),
  sessionToken: text("session_token"),
  otp: text("otp"),
  otpExpires: timestamp("otp_expires"),
});

const content = pgTable("content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  url: text("url"),
  thumbnail: text("thumbnail"),
  createdAt: timestamp("created_at").defaultNow(),
});

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
  dbInstance = drizzle(pool);
  return dbInstance;
}

// ============ SMS HELPER (Async) ============
async function sendSMS(phone: string, message: string) {
  const apiKey = process.env.SMS_IR_API_KEY;
  const templateId = process.env.SMS_IR_TEMPLATE_ID;
  
  if (!apiKey || !templateId) {
    console.warn("SMS Config missing");
    return;
  }
  
  try {
    const response = await fetch("https://api.sms.ir/v1/send/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
      body: JSON.stringify({
        mobile: phone,
        templateId: parseInt(templateId),
        parameters: [{ name: "Code", value: message }]
      })
    });
    const result = await response.json();
    console.log("SMS API Result:", result);
  } catch (e) {
    console.error("SMS Error:", e);
  }
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
    const method = req.method;
    const url = new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`);
    // Vercel sometimes passes full URL or rewritten path. Let's normalize.
    let pathname = url.pathname;

    // If pathname is just "/", but original req.url has path (common in rewrites)
    if (pathname === '/' && req.url && req.url.includes('/api/')) {
        pathname = req.url.split('?')[0]; // simple path extraction
    }
    
    // Normalize trailing slash
    if (pathname.endsWith('/') && pathname.length > 1) pathname = pathname.slice(0, -1);

    const body = req.body || {};

    // DEBUG LOG
    console.log(`[ROUTER] Processing: ${pathname} (Method: ${method})`);

    // Match exact routes
    if (pathname === '/api/health') {
      return res.status(200).json({ status: 'ok', hasDb: !!process.env.DATABASE_URL });
    }
    
    // Allow matching both "/api/user" and "/user" (in case of rewrites stripping prefix)
    const match = (p: string) => pathname === p || pathname === p.replace('/api', '');

    const cookies = req.headers.cookie || '';
    const sessionToken = cookies.split(';').find((c) => c.trim().startsWith('session='))?.split('=')[1]?.trim();
    let currentUser = null;
    if (sessionToken && sessionToken.length > 10) { 
      const results = await db.select().from(users).where(eq(users.sessionToken, sessionToken));
      currentUser = results[0];
    }

    if (match('/api/user') && method === 'GET') {
      if (!currentUser) return res.status(401).json(null);
      const { password: _, otp: __, otpExpires: ___, ...safeUser } = currentUser;
      return res.status(200).json(safeUser);
    }

    if (match('/api/auth/otp/request') && method === 'POST') {
      const { phone } = body;
      if (!phone) return res.status(400).json({ error: "شماره موبایل الزامی است" });
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
      const results = await db.select().from(users).where(eq(users.phone, phone));
      let user = results[0];
      const ADMIN_PHONES = ["09222453571", "09123104254"];
      const isAdmin = ADMIN_PHONES.includes(phone);

      if (!user) {
        const insertResults = await db.insert(users).values({
          username: `user_${phone}`,
          phone,
          role: isAdmin ? "admin" : "user",
        }).returning();
        user = insertResults[0];
      }
      
      await db.update(users).set({ 
        otp, 
        otpExpires,
        role: isAdmin && user.role !== 'admin' ? 'admin' : user.role 
      }).where(eq(users.id, user.id));

      await sendSMS(phone, otp);
      return res.status(200).json({ message: "کد ارسال شد" });
    }

    if (match('/api/auth/otp/verify') && method === 'POST') {
      const { phone, otp, rememberMe } = body;
      const results = await db.select().from(users).where(eq(users.phone, phone));
      const user = results[0];
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

    if (match('/api/login') && method === 'POST') {
      const { username, password, rememberMe } = body;
      const results = await db.select().from(users).where(eq(users.username, username));
      const user = results[0];
      if (!user || !user.password || !(await comparePasswords(password, user.password))) {
        return res.status(401).json({ error: 'اطلاعات نادرست است' });
      }
      const newToken = randomBytes(32).toString('hex');
      await db.update(users).set({ sessionToken: newToken }).where(eq(users.id, user.id));
      const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
      res.setHeader('Set-Cookie', `session=${newToken}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}; Path=/`);
      return res.status(200).json(user);
    }

    // ============ PROFILE UPDATES ============
    if (match('/api/profile') && method === 'PATCH') {
      if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

      const { firstName, lastName, birthDate, bio } = body;
      
      // Update basic info
      await db.update(users).set({ 
        firstName, 
        lastName, 
        birthDate: birthDate ? new Date(birthDate).toISOString() : null, 
        bio 
      }).where(eq(users.id, currentUser.id));

      return res.status(200).json({ success: true, message: "پروفایل آپدیت شد" });
    }

    if (match('/api/profile/password') && method === 'POST') {
      if (!currentUser) return res.status(401).json({ error: "Unauthorized" });
      const { currentPassword, newPassword } = body;

      // Logic: If user has a password set, verify it first
      if (currentUser.password) {
         if (!currentPassword || !(await comparePasswords(currentPassword, currentUser.password))) {
             return res.status(400).send("رمز عبور فعلی اشتباه است");
         }
      }

      // Hash new password
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(newPassword, salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;

      await db.update(users).set({ password: hashedPassword }).where(eq(users.id, currentUser.id));
      return res.status(200).json({ success: true, message: "رمز عبور تغییر کرد" });
    }

    if (match('/api/logout') && method === 'POST') {
      if (currentUser) {
        await db.update(users).set({ sessionToken: null }).where(eq(users.id, currentUser.id));
      }
      res.setHeader('Set-Cookie', 'session=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
      return res.status(200).json({ success: true });
    }

    if (match('/api/content') && method === 'GET') {
      return res.status(200).json(await db.select().from(content).orderBy(desc(content.createdAt)));
    }

    // ... endpoints ...

    // DEBUG: Log for unmatched routes
    console.log(`[API 404] Method: ${method}, URL: ${req.url}, Path: ${pathname}`);
    
    return res.status(404).json({ 
      error: 'Not Found (No matching route)',
      debug: {
        received_method: method,
        received_url: req.url,
        parsed_pathname: pathname,
        host: req.headers.host
      }
    });

  } catch (err: any) {
    console.error("[API ERROR]", err);
    return res.status(500).json({ error: "Server Error", message: err.message });
  }
}
