
import { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { pgTable, text, serial, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const scryptAsync = promisify(scrypt);

// ============ INPUT VALIDATION SCHEMAS ============
const phoneSchema = z.object({
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل نامعتبر است"),
  rememberMe: z.boolean().optional(),
});

const otpVerifySchema = z.object({
  phone: z.string().regex(/^09\d{9}$/),
  otp: z.string().length(6).regex(/^\d+$/),
  rememberMe: z.boolean().optional(),
});

const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  phone: z.string().regex(/^09\d{9}$/).optional(),
});

const profileUpdateSchema = z.object({
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  birthDate: z.string().optional(),
  bio: z.string().max(500).optional(),
  level: z.string().optional(),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6),
});

const paymentSubmitSchema = z.object({
  contentId: z.number().optional(),
  amount: z.number().optional(),
  trackingCode: z.string().optional(),
  transactionHash: z.string().optional(),
});

// ============ RATE LIMITER ============
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (entry.count >= maxAttempts) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap.entries()) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 300000);

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

const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  contentId: integer("content_id").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").default("pending"),
  trackingCode: text("tracking_code"),
  createdAt: timestamp("created_at").defaultNow(),
});

const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  contentId: integer("content_id").notNull(),
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

    // --- SINGLE CONTENT ---
    if (pathname.match(/\/api\/content\/\d+/) && method === 'GET') {
      const idMatch = pathname.match(/\/api\/content\/(\d+)/);
      const id = parseInt(idMatch![1]);
      const results = await db.select().from(content).where(eq(content.id, id));
      if (results.length === 0) return res.status(404).json({ error: "Content not found" });
      return res.status(200).json(results[0]);
    }

    // --- CONTENT LIST ---
    if (pathname === '/api/content' && method === 'GET') {
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
      const parsed = profileUpdateSchema.safeParse(body);
      if (!parsed.success) return res.status(400).json({ error: "ورودی نامعتبر", details: parsed.error.flatten() });
      const { firstName, lastName, birthDate, bio, level } = parsed.data;
      
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
      const parsed = passwordChangeSchema.safeParse(body);
      if (!parsed.success) return res.status(400).json({ error: "رمز عبور جدید حداقل ۶ کاراکتر باشد" });
      const { currentPassword, newPassword } = parsed.data;
      
      // If user has existing password, verify it
      if (currentUser.password) {
           if (!currentPassword || !(await comparePasswords(currentPassword, currentUser.password))) {
               return res.status(400).json("رمز عبور فعلی اشتباه است");
           }
      }
      
      // Hash new password
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(newPassword, salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;
      
      await db.update(users).set({ password: hashedPassword }).where(eq(users.id, currentUser.id));
      return res.status(200).json({ success: true });
    }

    // --- PURCHASES ---
    if (pathname.includes('/purchases') && method === 'GET') {
      if (!currentUser) return res.status(401).json([]);
      const results = await db.select().from(purchases).where(eq(purchases.userId, currentUser.id));
      return res.status(200).json(results);
    }

    // --- SUBMIT PAYMENT ---
    if (pathname.includes('/payments') && method === 'POST') {
      if (!currentUser) return res.status(401).json({ error: "Unauthorized" });
      const parsed = paymentSubmitSchema.safeParse(body);
      if (!parsed.success) return res.status(400).json({ error: "اطلاعات پرداخت نامعتبر" });
      const { contentId, amount, trackingCode, transactionHash } = parsed.data;
      
      const insertResults = await db.insert(payments).values({
          userId: currentUser.id,
          contentId: contentId || 0,
          amount: amount || 0,
          status: 'pending',
          trackingCode: trackingCode || transactionHash || 'N/A',
      }).returning();
      
      return res.status(200).json(insertResults[0]);
    }

    // --- ADMIN: LIST ALL PAYMENTS ---
    if (pathname.includes('/payments') && method === 'GET') {
      if (!currentUser || currentUser.role !== 'admin') {
          // If not admin, maybe they meant user purchases? 
          // But VideoDetail uses /api/purchases. Payment page uses /api/payments for submission.
          // Let's keep this admin-only for GET /api/payments.
          return res.status(403).json({ error: "Forbidden" });
      }
      
      // Join logic would be nice, but let's keep it simple for now (raw pool or drizzle)
      const results = await db.select().from(payments).orderBy(desc(payments.createdAt));
      return res.status(200).json(results);
    }

    // --- ADMIN: UPDATE PAYMENT STATUS ---
    if (pathname.match(/\/payments\/\d+\/status/) && method === 'PATCH') {
      if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      
      const idMatch = pathname.match(/\/payments\/(\d+)\/status/);
      const paymentId = parseInt(idMatch![1]);
      const { status } = body;
      
      const results = await db.update(payments).set({ status }).where(eq(payments.id, paymentId)).returning();
      const updatedPayment = results[0];
      
      if (updatedPayment && status === 'approved') {
          // Grant access!
          await db.insert(purchases).values({
              userId: updatedPayment.userId,
              contentId: updatedPayment.contentId
          });
      }
      
      return res.status(200).json(updatedPayment);
    }

    // --- AUTH ROUTES ---
    if (pathname.includes('/otp/request') && method === 'POST') {
      const parsed = phoneSchema.safeParse(body);
      if (!parsed.success) return res.status(400).json({ error: "شماره موبایل نامعتبر است" });
      const { phone } = parsed.data;
      
      // Rate limit OTP requests
      const ip = (req.headers['x-forwarded-for'] as string || 'unknown').split(',')[0].trim();
      if (!checkRateLimit(`otp:${ip}`, 5, 120000)) {
        return res.status(429).json({ error: "تعداد درخواست‌ها بیش از حد مجاز. ۲ دقیقه صبر کنید." });
      }
      
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

    if (pathname.includes('/otp/verify') && method === 'POST') {
      const parsed = otpVerifySchema.safeParse(body);
      if (!parsed.success) return res.status(400).json({ error: "کد تایید باید ۶ رقم باشد" });
      const { phone, otp, rememberMe } = parsed.data;
      
      // Rate limit OTP verification
      const ip = (req.headers['x-forwarded-for'] as string || 'unknown').split(',')[0].trim();
      if (!checkRateLimit(`verify:${ip}`, 10, 120000)) {
        return res.status(429).json({ error: "تعداد تلاش‌ها بیش از حد مجاز. ۲ دقیقه صبر کنید." });
      }
      
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
      const parsed = registerSchema.safeParse(body);
      if (!parsed.success) return res.status(400).json({ error: "اطلاعات ثبت‌نام نامعتبر", details: parsed.error.flatten() });
      const { username, password, firstName, lastName, phone } = parsed.data;
      
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
      const parsed = loginSchema.safeParse(body);
      if (!parsed.success) return res.status(400).json({ error: "نام کاربری یا رمز عبور نامعتبر" });
      const { username, password, rememberMe } = parsed.data;
      
      // Rate limit login attempts
      const ip = (req.headers['x-forwarded-for'] as string || 'unknown').split(',')[0].trim();
      if (!checkRateLimit(`login:${ip}`, 10, 120000)) {
        return res.status(429).json({ error: "تعداد تلاش‌ها بیش از حد مجاز. ۲ دقیقه صبر کنید." });
      }
      
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
