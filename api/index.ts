
import { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { pgTable, text, serial, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { eq, desc } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

// ============ GLOBAL POOL (Isolated) ============
// Defines a robust connection pool globally to be reused across requests
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3, 
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Initialize Drizzle with the pool
const db = drizzle(pool);

// ============ LOCAL SCHEMA DEFINITION ============
// Manually defined to match DB structure and avoid circular dependencies
const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  phone: text("phone").unique(),
  password: text("password"),
  role: text("role").default("user"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  avatar: text("avatar"),
  bio: text("bio"),
  birthDate: text("birth_date"),
  level: text("level").default("beginner"),
  streak: integer("streak").default(0),
  lastSeenAt: timestamp("last_seen_at"),
  sessionToken: text("session_token"),
  otp: text("otp"),
  otpExpires: timestamp("otp_expires"),
});

const content = pgTable("content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  contentUrl: text("content_url"),
  videoId: text("video_id"),
  videoProvider: text("video_provider"),
  arvanVideoId: text("arvan_video_id"),
  arvanVideoProvider: text("arvan_video_provider"),
  fileKey: text("file_key"),
  isPremium: boolean("is_premium"),
  price: integer("price"),
  thumbnailUrl: text("thumbnail_url"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

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
    const method = req.method;
    const url = new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`);
    let pathname = url.pathname;

    // Normalization logic for Vercel rewrites
    if (pathname === '/' && req.url && req.url.includes('/api/')) {
        pathname = req.url.split('?')[0]; 
    }
    if (pathname.endsWith('/') && pathname.length > 1) pathname = pathname.slice(0, -1);

    const body = req.body || {};

    console.log(`[ROUTER] Processing: ${pathname} (Method: ${method})`);

    // Health check
    if (pathname === '/api/health' || pathname.includes('/health')) {
      return res.status(200).json({ status: 'ok', hasDb: !!process.env.DATABASE_URL });
    }

    // Check Session
    const cookies = req.headers.cookie || '';
    const sessionToken = cookies.split(';').find((c) => c.trim().startsWith('session='))?.split('=')[1]?.trim();
    
    let currentUser = null;
    try {
        if (sessionToken && sessionToken.length > 10) { 
          const results = await db.select().from(users).where(eq(users.sessionToken, sessionToken));
          currentUser = results[0];
        }
    } catch (e) {
        console.warn("[SESSION CHECK ERROR] ignoring...", e);
    }

    // --- CONTENT (UPDATED TO RAW SQL) ---
    if (pathname.includes('/content') && method === 'GET') {
      try {
        console.log("Fetching content via Raw SQL...");
        const result = await pool.query(`
          SELECT 
            id, title, description, type, level, 
            content_url as "contentUrl", 
            video_id as "videoId", 
            video_provider as "videoProvider", 
            arvan_video_id as "arvanVideoId",
            arvan_video_provider as "arvanVideoProvider",
            file_key as "fileKey",
            is_premium as "isPremium", 
            price, 
            thumbnail_url as "thumbnailUrl", 
            metadata, 
            created_at as "createdAt"
          FROM content 
          ORDER BY created_at DESC
        `);
        return res.status(200).json(result.rows);
      } catch (err: any) {
        console.error("Error fetching content:", err);
        return res.status(500).json({ error: "Failed to fetch content", details: err.message });
      }
    }

    // --- USER PROFILE & STREAK LOGIC ---
    if (pathname.includes('/user') && method === 'GET') {
      if (!currentUser) return res.status(401).json(null);

      // Calculate Streak
      const now = new Date();
      const lastSeen = currentUser.lastSeenAt ? new Date(currentUser.lastSeenAt) : null;
      let newStreak = currentUser.streak || 0;
      let shouldUpdate = false;

      if (!lastSeen) {
        // First time ever
        newStreak = 1;
        shouldUpdate = true;
      } else {
        const diffTime = Math.abs(now.getTime() - lastSeen.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Check if same day (ignoring time) to avoid spamming updates
        const isSameDay = now.getDate() === lastSeen.getDate() && 
                          now.getMonth() === lastSeen.getMonth() && 
                          now.getFullYear() === lastSeen.getFullYear();

        if (!isSameDay) {
          if (diffDays <= 2) {
             // Consecutive day (roughly) -> Increment
             newStreak += 1;
          } else {
             // Missed a day -> Reset
             newStreak = 1;
          }
          shouldUpdate = true;
        }
      }

      if (shouldUpdate) {
        // Update DB in background (fire and forget mostly, but we await to be safe)
        try {
          await db.update(users).set({ 
            streak: newStreak, 
            lastSeenAt: now 
          }).where(eq(users.id, currentUser.id));
          // Update local object to return fresh data
          currentUser.streak = newStreak;
          currentUser.lastSeenAt = now;
        } catch (e) {
          console.error("Failed to update streak", e);
        }
      }

      const { password: _, otp: __, otpExpires: ___, ...safeUser } = currentUser;
      return res.status(200).json(safeUser);
    }

    // --- PROFILE UPDATE ---
    if (pathname.includes('/profile') && method === 'PATCH') {
      if (!currentUser) return res.status(401).json({ error: "Unauthorized" });
      const { firstName, lastName, birthDate, bio, level } = body;
      
      await db.update(users).set({
          firstName,
          lastName,
          birthDate,
          bio,
          level
      }).where(eq(users.id, currentUser.id));
      
      return res.status(200).json({ success: true });
    }

    // --- PASSWORD UPDATE ---
    if (pathname.includes('/profile/password') && method === 'POST') {
      if (!currentUser) return res.status(401).json({ error: "Unauthorized" });
      const { currentPassword, newPassword } = body;
      
      // If user has existing password, verify it
      if (currentUser.password) {
           if (!currentPassword || !(await comparePasswords(currentPassword, currentUser.password))) {
               return res.status(400).json("رمز عبور فعلی اشتباه است"); // Return string as client expects text() sometimes or json
           }
      }
      
      // Hash new password
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(newPassword, salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;
      
      await db.update(users).set({ password: hashedPassword }).where(eq(users.id, currentUser.id));
      return res.status(200).json({ success: true });
    }

    // --- AUTH ROUTES ---
    if (pathname.includes('/otp/request') && method === 'POST') {
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
        role: isAdmin && user.role !== 'admin' ? 'admin' : user.role // Only upgrade to admin if not already
      }).where(eq(users.id, user.id));

      await sendSMS(phone, otp);
      return res.status(200).json({ message: "کد ارسال شد" });
    }

    if (pathname.includes('/otp/verify') && method === 'POST') {
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

    if (pathname.includes('/register') && method === 'POST') {
      const { username, password, firstName, lastName, phone } = body;
      
      // Check existing
      const existing = await db.select().from(users).where(eq(users.username, username));
      if (existing.length > 0) {
        return res.status(400).json({ error: "این نام کاربری قبلاً ثبت شده است" });
      }

      // Hash password
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(password, salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;

      // Insert new user
      const results = await db.insert(users).values({
        username,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: 'user',
        level: 'beginner',
        streak: 0,
      }).returning();
      
      const user = results[0];
      
      // Create Session
      const newToken = randomBytes(32).toString('hex');
      await db.update(users).set({ sessionToken: newToken }).where(eq(users.id, user.id));
      
      res.setHeader('Set-Cookie', `session=${newToken}; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}; Path=/`);
      
      const { password: _, otp: __, otpExpires: ___, ...safeUser } = user;
      return res.status(200).json(safeUser);
    }

    if (pathname.includes('/login') && method === 'POST') {
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

    if (pathname.includes('/logout') && method === 'POST') {
      if (currentUser) {
        await db.update(users).set({ sessionToken: null }).where(eq(users.id, currentUser.id));
      }
      res.setHeader('Set-Cookie', 'session=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
      return res.status(200).json({ success: true });
    }

    // Default 404
    console.log(`[API 404] Method: ${method}, URL: ${req.url}, Path: ${pathname}`);
    return res.status(404).json({ error: 'Not Found' });

  } catch (err: any) {
    console.error("[API ERROR]", err);
    return res.status(500).json({ error: "Server Error", message: err.message });
  }
}
