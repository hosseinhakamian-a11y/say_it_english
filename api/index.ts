
import { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { eq, ilike, and, or, desc, sql } from "drizzle-orm";
import "dotenv/config";
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

const chatMessageSchema = z.object({
  message: z.string().min(1).max(1000),
});

const igDraftInputSchema = z.object({
  inbound: z.string().min(1).max(4000),
  context: z.enum(['dm', 'comment']).optional(),
  studentHandle: z.string().max(100).optional(),
});

const igDraftUpdateSchema = z.object({
  edited: z.string().max(4000).optional(),
  sentStatus: z.enum(['edited', 'sent', 'discarded']).optional(),
});

// No `amount` here on purpose: the price is always resolved server-side from PLANS/content/class.
// nullish(), not optional(): every client sends `trackingCode: null` OR `transactionHash: null`
// depending on the tab, and optional() rejects null — that 400'd every manual payment.
const paymentSubmitSchema = z.object({
  contentId: z.number().nullish(),
  classId: z.number().nullish(),
  planId: z.string().max(20).nullish(),
  promoCode: z.string().max(50).nullish(),
  trackingCode: z.string().nullish(),
  transactionHash: z.string().nullish(),
});

const classUpsertSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullish(),
  level: z.string().min(1).max(50),
  capacity: z.number().int().positive(),
  price: z.number().int().nonnegative(),
  schedule: z.string().min(1).max(200),
  meetLink: z.string().max(500).nullish(),
});

// ============ RATE LIMITER ============
const bookingSchema = z.object({
  timeSlotId: z.number(),
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل نامعتبر است"),
  notes: z.string().optional(),
  paymentMethod: z.string().optional(),
  trackingHash: z.string().optional(),
});

const slotSchema = z.object({
  date: z.string().datetime(), // ISO 8601
  duration: z.number().optional().default(30),
  price: z.number().optional().default(0),
});

// ============ RATE LIMITER ============
// In-memory fallback: only correct within a single warm Vercel instance, NOT across
// concurrent/cold invocations. Used automatically when Upstash isn't configured.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimitInMemory(key: string, maxAttempts: number, windowMs: number): boolean {
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

// Real distributed rate limiting via Upstash Redis REST API (INCR + EXPIRE NX in one pipeline
// call). Falls back to the in-memory limiter above if UPSTASH_REDIS_REST_URL/TOKEN aren't set,
// or if the Upstash request itself fails (fail-open so a Redis outage doesn't lock out users).
async function checkRateLimit(key: string, maxAttempts: number = 5, windowMs: number = 60000): Promise<boolean> {
  const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return checkRateLimitInMemory(key, maxAttempts, windowMs);
  }

  const windowSeconds = Math.ceil(windowMs / 1000);
  try {
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', `ratelimit:${key}`],
        ['EXPIRE', `ratelimit:${key}`, windowSeconds.toString(), 'NX'],
      ]),
    });
    const [incrResult] = await res.json();
    const count = incrResult?.result;
    if (typeof count !== 'number') {
      console.warn('[RATE LIMIT] Unexpected Upstash response, failing open', incrResult);
      return true;
    }
    return count <= maxAttempts;
  } catch (err) {
    console.warn('[RATE LIMIT] Upstash request failed, falling back to in-memory', err);
    return checkRateLimitInMemory(key, maxAttempts, windowMs);
  }
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap.entries()) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 300000);

// ============ IG DRAFT AUTH ============
// Single shared secret (IG_DRAFT_TOKEN env) sent as "Authorization: Bearer <token>".
// If the env var is missing the endpoint stays closed — never fail open (the
// /api/content leak fixed in 1e619b2 is the cautionary tale here).
function checkIgDraftAuth(req: VercelRequest): boolean {
  const expected = process.env.IG_DRAFT_TOKEN;
  if (!expected) return false;
  const header = (req.headers['authorization'] as string) || '';
  const provided = header.replace(/^Bearer\s+/i, '');
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}

// ============ GLOBAL POOL (Isolated) ============
// Defines a robust connection pool globally to be reused across requests
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1, // serverless: one connection per instance; Supabase pooler (6543) does the pooling
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Initialize Drizzle with the pool
const db = drizzle(pool);

// ============ LOCAL SCHEMA DEFINITION ============
// Manually defined to match DB structure and avoid circular dependencies
// ponytail: duplicated with shared/schema.ts (~220 lines). Merging needs the live DB to verify
// no column is dropped; the Supabase project was unreachable on 2026-07-23, so `db:push` is
// disabled in package.json instead. Merge once the DB is back and push --dry-run shows no DROP.
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
  xp: integer("xp").default(0),
  lastSeenAt: timestamp("last_seen_at"),
  sessionToken: text("session_token"),
  otp: text("otp"),
  otpExpires: timestamp("otp_expires"),
  createdAt: timestamp("created_at").defaultNow(),
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
  contentId: integer("content_id"),
  classId: integer("class_id"),
  amount: integer("amount").notNull(),
  status: text("status").default("pending"),
  gateway: text("gateway").default("zarinpal"),
  referenceId: text("reference_id"),
  trackingCode: text("tracking_code"),
  createdAt: timestamp("created_at").defaultNow(),
});

const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  contentId: integer("content_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ PHASE 2: PROGRESS SYSTEM TABLES ============
const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  contentId: integer("content_id").notNull(),
  watchedPercent: integer("watched_percent").default(0),
  quizScore: integer("quiz_score").default(0),
  vocabReviewed: integer("vocab_reviewed").default(0),
  completedAt: timestamp("completed_at"),
  xpEarned: integer("xp_earned").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull(),
  icon: text("icon").notNull(),
  description: text("description").notNull(),
  condition: text("condition").notNull(),
  xpReward: integer("xp_reward").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  badgeId: integer("badge_id").notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
});

const savedVocabulary = pgTable("saved_vocabulary", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  contentId: integer("content_id").notNull(),
  word: text("word").notNull(),
  meaning: text("meaning").notNull(),
  example: text("example"),
  difficulty: integer("difficulty").default(1),
  reviewCount: integer("review_count").default(0),
  lastReviewedAt: timestamp("last_reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ PHASE 3: GAMIFICATION TABLES ============
const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").default("info"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow(),
});

const weeklyChallenges = pgTable("weekly_challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").default("🎯"),
  challengeType: text("challenge_type").notNull(),
  targetValue: integer("target_value").default(1),
  xpReward: integer("xp_reward").default(50),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

const userChallenges = pgTable("user_challenges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  challengeId: integer("challenge_id").notNull(),
  currentValue: integer("current_value").default(0),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ PHASE 4: MONETIZATION TABLES ============
const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountPercent: integer("discount_percent").notNull(),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").default(0),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  planId: text("plan_id").notNull(),
  status: text("status").default("active"),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date").notNull(),
  paymentId: integer("payment_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

const timeSlots = pgTable("time_slots", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  duration: integer("duration").default(30),
  isBooked: boolean("is_booked").default(false),
  price: integer("price").default(0),
  currency: text("currency").default("IRT"), // IRT or USDT
  createdAt: timestamp("created_at").defaultNow(),
});

const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  timeSlotId: integer("time_slot_id"),
  type: text("type").notNull().default("consultation"),
  date: timestamp("date").notNull(),
  status: text("status").default("pending"), // pending, confirmed, cancelled
  notes: text("notes"),
  phone: text("phone"),
  meetLink: text("meet_link"),
  paymentMethod: text("payment_method").default("card"),
  trackingCode: text("tracking_code"),
  transactionHash: text("transaction_hash"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ GROUP CLASSES TABLES ============
const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  level: text("level").notNull(),
  capacity: integer("capacity").notNull(),
  price: integer("price").notNull(),
  schedule: text("schedule").notNull(),
  meetLink: text("meet_link"), // Static Google Meet/Skyroom link, visible to enrolled students only
  createdAt: timestamp("created_at").defaultNow(),
});

const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  classId: integer("class_id").notNull(),
  status: text("status").default("enrolled"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Instagram DM/comment reply drafts (HITL) — mirrors shared/schema.ts igDrafts
const igDrafts = pgTable("ig_drafts", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  inbound: text("inbound").notNull(),
  context: text("context"), // 'dm' | 'comment' | null
  studentHandle: text("student_handle"),
  draft: text("draft").notNull(),
  edited: text("edited"),
  sentStatus: text("sent_status").default("drafted").notNull(), // drafted | edited | sent | discarded
  category: text("category"),
});

// ============ SUBSCRIPTION PLANS (single source of truth) ============
// Prices in Toman. Every consumer reads from here: the /api/payment/plans endpoint, the
// ZarinPal amount, the manual-payment guard, and the two AI system prompts. Never retype a
// number anywhere else — the old copies had drifted to a third of the real price and the
// gateway was charging that (audit 2026-07-23).
const PLANS = [
  { id: 'bronze', name: 'برنزی', price: 299000, durationDays: 30, features: ['دسترسی به تمام ویدیوها', 'آزمون‌های نامحدود'] },
  { id: 'silver', name: 'نقره‌ای', price: 599000, durationDays: 90, features: ['تمام امکانات برنزی', 'پشتیبانی اختصاصی', 'نشان نقره‌ای'] },
  { id: 'gold', name: 'طلایی', price: 1299000, durationDays: 365, features: ['تمام امکانات نقره‌ای', 'مشاوره آنلاین', 'نشان طلایی'] },
];

const planById = (id?: string | null) => PLANS.find(p => p.id === id);

// payments.referenceId doubles as the "which plan was this?" marker for non-gateway payments:
// `PLAN-<id>` on manual submit, `PLAN-<id>-<ts>` as the ZarinPal seed before the authority
// overwrites it. Both parse back through planFromReference.
const PLAN_REF = 'PLAN-';
const planFromReference = (ref?: string | null) =>
  ref?.startsWith(PLAN_REF) ? planById(ref.slice(PLAN_REF.length).split('-')[0]) : undefined;

// Same text block in both AI prompts, so a price change can't leak into only one of them.
const PLANS_TEXT = PLANS
  .map(p => `- ${p.name}: ${new Intl.NumberFormat('fa-IR').format(p.price)} تومان / ${p.durationDays} روز — ${p.features.join('، ')}`)
  .join('\n');

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

// ============ GROUP CLASS HELPERS ============
function isOnlineClassPaymentEnabled(): boolean {
  return process.env.ENABLE_ONLINE_CLASS_PAYMENT === 'true' && !!process.env.ZARINPAL_MERCHANT_ID;
}

// Best-effort SMS with the class meet link. Requires a dedicated approved template
// on sms.ir (SMS_IR_CLASS_TEMPLATE_ID) with a "LINK" parameter; skipped silently otherwise.
async function sendClassLinkSMS(phone: string, meetLink: string) {
  const apiKey = process.env.SMS_IR_API_KEY;
  const templateId = process.env.SMS_IR_CLASS_TEMPLATE_ID;
  if (!apiKey || !templateId) return;
  try {
    const response = await fetch("https://api.sms.ir/v1/send/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
      body: JSON.stringify({
        mobile: phone,
        templateId: parseInt(templateId),
        parameters: [{ name: "LINK", value: meetLink }]
      })
    });
    console.log("Class link SMS result:", await response.json());
  } catch (e) {
    console.error("Class link SMS error:", e);
  }
}

// Single conditional INSERT: the WHERE guards capacity, the unique index
// (uniq_enrollments_user_class) guards duplicates. No transaction needed.
async function enrollIfCapacity(userId: number, classId: number): Promise<'enrolled' | 'already_enrolled' | 'full'> {
  const result = await pool.query(
    `INSERT INTO enrollments (user_id, class_id, status)
     SELECT $1, $2, 'enrolled'
     WHERE (SELECT COUNT(*) FROM enrollments WHERE class_id = $2)
         < (SELECT capacity FROM classes WHERE id = $2)
     ON CONFLICT (user_id, class_id) DO NOTHING
     RETURNING id`,
    [userId, classId]
  );
  if ((result.rowCount || 0) > 0) return 'enrolled';
  const existing = await pool.query(
    `SELECT 1 FROM enrollments WHERE user_id = $1 AND class_id = $2`,
    [userId, classId]
  );
  return (existing.rowCount || 0) > 0 ? 'already_enrolled' : 'full';
}

// Enroll + notify. The in-app notification is the primary channel; SMS is best-effort.
async function grantClassEnrollment(userId: number, classId: number): Promise<'enrolled' | 'already_enrolled' | 'full'> {
  const outcome = await enrollIfCapacity(userId, classId);
  if (outcome !== 'enrolled') return outcome;
  try {
    const clsRows = await db.select().from(classes).where(eq(classes.id, classId));
    const cls = clsRows[0];
    await db.insert(notifications).values({
      userId,
      type: 'achievement',
      title: '🎉 ثبت‌نام تایید شد',
      message: cls
        ? `ثبت‌نام شما در کلاس «${cls.title}» تایید شد. لینک جلسه در بخش «کلاس‌های من» داشبورد در دسترس است.`
        : 'ثبت‌نام شما در کلاس گروهی تایید شد. جزئیات در داشبورد.',
      link: '/dashboard',
    });
    if (cls?.meetLink) {
      const userRows = await db.select().from(users).where(eq(users.id, userId));
      if (userRows[0]?.phone) await sendClassLinkSMS(userRows[0].phone, cls.meetLink);
    }
  } catch (e) {
    console.error('[ENROLLMENT NOTIFY ERROR]', e);
  }
  return 'enrolled';
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
      // Storage keys stay server-side for non-admins; playback goes through /api/download
      if (!currentUser || currentUser.role !== 'admin') {
        const { fileKey, contentUrl, ...safeItem } = results[0];
        return res.status(200).json(safeItem);
      }
      return res.status(200).json(results[0]);
    }

    // --- UPDATE CONTENT (ADMIN) ---
    if (pathname.match(/\/api\/content\/\d+/) && method === 'PATCH') {
      if (!currentUser || currentUser.role !== 'admin') {
         return res.status(403).json({ error: "Forbidden" });
      }
      
      const idMatch = pathname.match(/\/api\/content\/(\d+)/);
      const id = parseInt(idMatch![1]);
      
      // Update the fields dynamically passed in the body
      const results = await db.update(content).set({
          ...body,
      }).where(eq(content.id, id)).returning();
      
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
            body,
            slug,
            author,
            tags,
            created_at as "createdAt"
          FROM content
          ORDER BY created_at DESC
        `);
        // Storage keys stay server-side for non-admins; playback goes through /api/download
        if (!currentUser || currentUser.role !== 'admin') {
          return res.status(200).json(result.rows.map(({ fileKey, contentUrl, ...rest }) => rest));
        }
        return res.status(200).json(result.rows);
      } catch (err: any) {
        console.error("Error fetching content:", err);
        return res.status(500).json({ error: "Failed to fetch content", details: err.message });
      }
    }

    // --- SECURE DOWNLOAD / STREAM (presigned ArvanCloud URL, 1 hour) ---
    // GET /api/download?id=<contentId>&stream=true — used by SecureVideoPlayer
    if (pathname === '/api/download' && method === 'GET') {
      if (!currentUser) return res.status(401).json({ error: "Unauthorized" });
      const idParam = url.searchParams.get('id');
      const stream = url.searchParams.get('stream') === 'true';
      const contentIdNum = parseInt(idParam || '');
      if (!contentIdNum) return res.status(400).json({ error: "Invalid content id" });

      const rows = await db.select().from(content).where(eq(content.id, contentIdNum));
      if (rows.length === 0) return res.status(404).json({ error: "Content not found" });
      const item = rows[0];

      // Premium content requires a purchase (admins bypass) — parity with server/routes/content.ts
      if (item.isPremium && currentUser.role !== 'admin') {
        const owned = await db.select().from(purchases)
          .where(and(eq(purchases.userId, currentUser.id), eq(purchases.contentId, contentIdNum)));
        if (owned.length === 0) return res.status(403).json({ error: "برای دسترسی به این محتوا ابتدا آن را خریداری کنید" });
      }

      const fileKey = item.fileKey || item.videoId || item.contentUrl;
      if (!fileKey) return res.status(400).json({ error: "این محتوا فایل قابل پخش/دانلود ندارد" });

      // ARVAN_* are the names actually set in Vercel (and in .env); the ARVAN_S3_* names this
      // code was written against were never set there, so storage 500'd on production.
      const AWS_ENDPOINT = process.env.ARVAN_S3_ENDPOINT || process.env.ARVAN_ENDPOINT || 'https://s3.ir-thr-at1.arvanstorage.ir';
      const AWS_BUCKET   = process.env.ARVAN_S3_BUCKET || process.env.ARVAN_BUCKET_NAME || '';
      const AWS_KEY      = process.env.ARVAN_S3_ACCESS_KEY || process.env.ARVAN_ACCESS_KEY || '';
      const AWS_SECRET   = process.env.ARVAN_S3_SECRET_KEY || process.env.ARVAN_SECRET_KEY || '';
      if (!AWS_BUCKET || !AWS_KEY || !AWS_SECRET) {
        return res.status(500).json({ error: "Storage credentials not configured. Set ARVAN_BUCKET_NAME, ARVAN_ACCESS_KEY, ARVAN_SECRET_KEY (or the ARVAN_S3_* aliases) in env." });
      }

      try {
        const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
        const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

        const s3 = new S3Client({
          region: "ir-thr-at1",
          endpoint: AWS_ENDPOINT,
          credentials: { accessKeyId: AWS_KEY, secretAccessKey: AWS_SECRET },
          forcePathStyle: true,
        });

        const downloadName = fileKey.split('/').pop() || 'download';
        const command = new GetObjectCommand({
          Bucket: AWS_BUCKET,
          Key: fileKey,
          ResponseContentDisposition: stream ? 'inline' : `attachment; filename="${downloadName}"`,
        });

        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
        return res.redirect(302, signedUrl);
      } catch (err: any) {
        console.error("[S3 DOWNLOAD ERROR]", err);
        return res.status(500).json({ error: "Failed to generate download link", details: err.message });
      }
    }

    // --- USERS LIST (ADMIN) ---
    if (pathname === '/api/users' && method === 'GET') {
      if (!currentUser || currentUser.role !== 'admin') {
         return res.status(403).json({ error: "Forbidden" });
      }
      const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
      const safeUsers = allUsers.map(({ password, otp, sessionToken, ...rest }) => rest);
      return res.status(200).json(safeUsers);
    }

    // --- USER ROLE UPDATE (ADMIN) ---
    if (pathname.match(/\/api\/users\/\d+\/role/) && method === 'PATCH') {
      if (!currentUser || currentUser.role !== 'admin') {
         return res.status(403).json({ error: "Forbidden" });
      }
      const idMatch = pathname.match(/\/api\/users\/(\d+)\/role/);
      const userId = parseInt(idMatch![1]);
      const { role } = body;
      
      const results = await db.update(users).set({ role }).where(eq(users.id, userId)).returning();
      if (results.length === 0) return res.status(404).json({ error: "User not found" });
      const { password, otp, sessionToken, ...safeUser } = results[0];
      return res.status(200).json(safeUser);
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
      const { contentId, classId, planId, promoCode, trackingCode, transactionHash } = parsed.data;

      // Group-class enrollment payment: price comes from the class, never the client
      if (classId) {
        const clsRows = await db.select().from(classes).where(eq(classes.id, classId));
        if (clsRows.length === 0) return res.status(404).json({ error: "کلاس یافت نشد" });
        const cls = clsRows[0];

        const existing = await db.select().from(enrollments)
          .where(and(eq(enrollments.userId, currentUser.id), eq(enrollments.classId, classId)));
        if (existing.length > 0) return res.status(409).json({ error: "شما قبلاً در این کلاس ثبت‌نام کرده‌اید" });

        const countResult = await pool.query(`SELECT COUNT(*)::int AS cnt FROM enrollments WHERE class_id = $1`, [classId]);
        if (countResult.rows[0].cnt >= cls.capacity) {
          return res.status(409).json({ error: "ظرفیت کلاس تکمیل شده است" });
        }

        const insertResults = await db.insert(payments).values({
            userId: currentUser.id,
            classId,
            amount: cls.price,
            status: 'pending',
            trackingCode: trackingCode || transactionHash || 'N/A',
        }).returning();

        return res.status(200).json(insertResults[0]);
      }

      // Plan or single-content purchase — price from the server, never the client (same rule
      // as the class branch above; `amount` used to be taken straight from the request body).
      let amount: number;
      let referenceId: string | null = null;
      if (planId) {
        const plan = planById(planId);
        if (!plan) return res.status(400).json({ error: "پلن نامعتبر" });
        amount = plan.price;
        referenceId = `${PLAN_REF}${plan.id}`; // read back on approval to grant the subscription
      } else if (contentId) {
        const rows = await db.select().from(content).where(eq(content.id, contentId));
        if (rows.length === 0) return res.status(404).json({ error: "محتوا یافت نشد" });
        amount = rows[0].price || 0;
      } else {
        return res.status(400).json({ error: "محتوا یا پلن مشخص نشده" });
      }

      // Promo revalidated here too — mirrors the ZarinPal path
      if (promoCode) {
        const promo = await db.select().from(promoCodes).where(eq(promoCodes.code, promoCode.toUpperCase()));
        if (promo.length > 0 && promo[0].isActive) {
          amount = Math.round(amount * (1 - promo[0].discountPercent / 100));
        }
      }

      const insertResults = await db.insert(payments).values({
          userId: currentUser.id,
          contentId: contentId || null,
          amount,
          status: 'pending',
          gateway: 'manual',
          referenceId,
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

      const existingRows = await db.select().from(payments).where(eq(payments.id, paymentId));
      if (existingRows.length === 0) return res.status(404).json({ error: "Payment not found" });
      if (existingRows[0].status === 'approved') {
        // Already processed — avoid granting a second purchase/enrollment on a repeat click
        return res.status(200).json(existingRows[0]);
      }

      const results = await db.update(payments).set({ status }).where(eq(payments.id, paymentId)).returning();
      const updatedPayment = results[0];

      if (updatedPayment && status === 'approved') {
          // Grant access!
          if (updatedPayment.contentId) {
            await db.insert(purchases).values({
                userId: updatedPayment.userId,
                contentId: updatedPayment.contentId
            });
          }
          // Manual (card/crypto) plan payment — without this an approved card-to-card payer
          // got no subscription at all; only the ZarinPal path created one.
          const approvedPlan = planFromReference(updatedPayment.referenceId);
          if (approvedPlan) {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + approvedPlan.durationDays);
            await db.insert(subscriptions).values({
              userId: updatedPayment.userId,
              planId: approvedPlan.id,
              status: 'active',
              endDate,
              paymentId: updatedPayment.id,
            });
          }
          if (updatedPayment.classId) {
            const outcome = await grantClassEnrollment(updatedPayment.userId, updatedPayment.classId);
            if (outcome === 'full') {
              // Seat vanished between submission and approval — revert so the admin sees it
              await db.update(payments).set({ status: 'pending' }).where(eq(payments.id, paymentId));
              return res.status(409).json({ error: "ظرفیت کلاس تکمیل شده است؛ پرداخت به حالت در انتظار برگشت. با دانش‌آموز هماهنگ کنید." });
            }
          }
      }

      return res.status(200).json(updatedPayment);
    }

    // ============ GROUP CLASSES ENDPOINTS ============

    // --- PUBLIC: LIST CLASSES (no meet_link!) ---
    if (pathname === '/api/classes' && method === 'GET') {
      const result = await pool.query(`
        SELECT c.id, c.title, c.description, c.level, c.capacity, c.price, c.schedule,
               c.created_at as "createdAt",
               COALESCE(e.cnt, 0)::int as "enrolled"
        FROM classes c
        LEFT JOIN (SELECT class_id, COUNT(*) as cnt FROM enrollments GROUP BY class_id) e
          ON e.class_id = c.id
        ORDER BY c.created_at DESC
      `);
      return res.status(200).json(result.rows);
    }

    // --- STUDENT: MY ENROLLED CLASSES (includes meet_link) ---
    if (pathname === '/api/my-classes' && method === 'GET') {
      if (!currentUser) return res.status(401).json({ error: "Unauthorized" });
      const result = await pool.query(`
        SELECT c.id, c.title, c.description, c.level, c.schedule,
               c.meet_link as "meetLink",
               en.status, en.created_at as "enrolledAt"
        FROM enrollments en
        JOIN classes c ON c.id = en.class_id
        WHERE en.user_id = $1
        ORDER BY en.created_at DESC
      `, [currentUser.id]);
      return res.status(200).json(result.rows);
    }

    // --- PUBLIC: PAYMENT CONFIG (feature flags for the client) ---
    if (pathname === '/api/payment/config' && method === 'GET') {
      return res.status(200).json({ onlineClassPaymentEnabled: isOnlineClassPaymentEnabled() });
    }

    // --- ADMIN: LIST CLASSES (all fields) ---
    if (pathname === '/api/admin/classes' && method === 'GET') {
      if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      const result = await pool.query(`
        SELECT c.id, c.title, c.description, c.level, c.capacity, c.price, c.schedule,
               c.meet_link as "meetLink", c.created_at as "createdAt",
               COALESCE(e.cnt, 0)::int as "enrolled"
        FROM classes c
        LEFT JOIN (SELECT class_id, COUNT(*) as cnt FROM enrollments GROUP BY class_id) e
          ON e.class_id = c.id
        ORDER BY c.created_at DESC
      `);
      return res.status(200).json(result.rows);
    }

    // --- ADMIN: CREATE CLASS ---
    if (pathname === '/api/admin/classes' && method === 'POST') {
      if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      const parsed = classUpsertSchema.safeParse(body);
      if (!parsed.success) return res.status(400).json({ error: "اطلاعات کلاس نامعتبر", details: parsed.error.flatten() });
      const results = await db.insert(classes).values(parsed.data).returning();
      return res.status(201).json(results[0]);
    }

    // --- ADMIN: UPDATE CLASS ---
    if (pathname.match(/\/api\/admin\/classes\/\d+$/) && method === 'PATCH') {
      if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      const idMatch = pathname.match(/\/api\/admin\/classes\/(\d+)$/);
      const classId = parseInt(idMatch![1]);
      const parsed = classUpsertSchema.partial().safeParse(body);
      if (!parsed.success) return res.status(400).json({ error: "اطلاعات کلاس نامعتبر", details: parsed.error.flatten() });
      const results = await db.update(classes).set(parsed.data).where(eq(classes.id, classId)).returning();
      if (results.length === 0) return res.status(404).json({ error: "کلاس یافت نشد" });
      return res.status(200).json(results[0]);
    }

    // --- ADMIN: DELETE CLASS (blocked while students are enrolled) ---
    if (pathname.match(/\/api\/admin\/classes\/\d+$/) && method === 'DELETE') {
      if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      const idMatch = pathname.match(/\/api\/admin\/classes\/(\d+)$/);
      const classId = parseInt(idMatch![1]);
      const enrolled = await pool.query(`SELECT COUNT(*)::int AS cnt FROM enrollments WHERE class_id = $1`, [classId]);
      if (enrolled.rows[0].cnt > 0) {
        return res.status(409).json({ error: "این کلاس ثبت‌نام فعال دارد و قابل حذف نیست" });
      }
      const results = await db.delete(classes).where(eq(classes.id, classId)).returning();
      if (results.length === 0) return res.status(404).json({ error: "کلاس یافت نشد" });
      return res.status(200).json({ success: true });
    }

    // --- ADMIN: CLASS ENROLLMENT LIST ---
    if (pathname.match(/\/api\/admin\/classes\/\d+\/enrollments$/) && method === 'GET') {
      if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      const idMatch = pathname.match(/\/api\/admin\/classes\/(\d+)\/enrollments$/);
      const classId = parseInt(idMatch![1]);
      const result = await pool.query(`
        SELECT en.id, en.status, en.created_at as "enrolledAt",
               u.id as "userId", u.username, u.phone,
               u.first_name as "firstName", u.last_name as "lastName"
        FROM enrollments en
        JOIN users u ON u.id = en.user_id
        WHERE en.class_id = $1
        ORDER BY en.created_at DESC
      `, [classId]);
      return res.status(200).json(result.rows);
    }

    // ============ BOOKING SYSTEM ENDPOINTS ============

    // --- GET AVAILABLE SLOTS ---
    if (pathname === '/api/slots' && method === 'GET') {
      const allSlots = await db.select().from(timeSlots)
        .where(eq(timeSlots.isBooked, false))
        .orderBy(timeSlots.date);
      return res.status(200).json(allSlots);
    }

    // --- ADMIN: ADD SLOT ---
    if (pathname === '/api/slots' && method === 'POST') {
      if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      const parsed = slotSchema.safeParse(body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data" });
      
      const { date, duration, price } = parsed.data;
      const result = await db.insert(timeSlots).values({
        date: new Date(date),
        duration,
        price,
        isBooked: false
      }).returning();
      
      return res.status(201).json(result[0]);
    }

    // --- ADMIN: DELETE SLOT ---
    if (pathname === '/api/slots' && method === 'DELETE') {
      if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      const id = parseInt(url.searchParams.get('id') || '0');
      if (!id) return res.status(400).json({ error: "Missing id" });
      
      await db.delete(timeSlots).where(eq(timeSlots.id, id));
      return res.status(200).json({ success: true });
    }

    // --- BOOK A SLOT ---
    if (pathname === '/api/book' && method === 'POST') {
      if (!currentUser) return res.status(401).json({ error: "Unauthorized" });
      const parsed = bookingSchema.safeParse(body);
      if (!parsed.success) return res.status(400).json({ error: "Input invalid" });
      
      const { timeSlotId, phone, notes, paymentMethod, trackingHash } = parsed.data;
      
      // 1. Check if slot exists and is free
      const slot = await db.select().from(timeSlots).where(eq(timeSlots.id, timeSlotId));
      if (slot.length === 0) return res.status(404).json({ error: "Slot not found" });
      if (slot[0].isBooked) return res.status(409).json({ error: "این زمان قبلاً رزرو شده است" });
      
      // 2. Create Booking
      const method = paymentMethod || 'card';
      const bookResult = await db.insert(bookings).values({
        userId: currentUser.id,
        timeSlotId,
        date: slot[0].date,
        type: 'consultation',
        status: 'pending',
        phone,
        notes,
        paymentMethod: method,
        trackingCode: method === 'card' ? trackingHash : null,
        transactionHash: method === 'crypto' ? trackingHash : null,
      }).returning();
      
      // 3. Mark Slot as Booked
      await db.update(timeSlots).set({ isBooked: true }).where(eq(timeSlots.id, timeSlotId));
      
      // 4. Send SMS Notification (to Admin or User)
      // await sendSMS(phone, "رزرو شما ثبت شد");
      
      return res.status(200).json(bookResult[0]);
    }

    // ============ PHASE 2: PROGRESS & LEARNING ENDPOINTS ============

    // --- USER PROGRESS: Update progress for a content item ---
    if (pathname.match(/\/api\/progress$/) && method === 'POST') {
      if (!currentUser) return res.status(401).json({ error: "Unauthorized" });
      const { contentId, watchedPercent, quizScore, vocabReviewed } = body;
      if (!contentId) return res.status(400).json({ error: "contentId is required" });
      
      // Calculate XP based on activity
      let xpEarned = 0;
      if (watchedPercent >= 90) xpEarned += 10; // Video completion
      if (quizScore) xpEarned += Math.round(quizScore * 0.2); // Quiz XP
      if (vocabReviewed) xpEarned += vocabReviewed * 5; // Vocab XP

      const isCompleted = watchedPercent >= 90 && (quizScore === undefined || quizScore >= 60);

      // Upsert progress
      const existingProgress = await db.select().from(userProgress)
        .where(and(eq(userProgress.userId, currentUser.id), eq(userProgress.contentId, contentId)));

      let progressResult;
      if (existingProgress.length > 0) {
        const prev = existingProgress[0];
        const newXp = Math.max(prev.xpEarned || 0, xpEarned);
        progressResult = await db.update(userProgress).set({
          watchedPercent: Math.max(prev.watchedPercent || 0, watchedPercent || 0),
          quizScore: Math.max(prev.quizScore || 0, quizScore || 0),
          vocabReviewed: Math.max(prev.vocabReviewed || 0, vocabReviewed || 0),
          xpEarned: newXp,
          completedAt: isCompleted && !prev.completedAt ? new Date() : prev.completedAt,
          updatedAt: new Date(),
        }).where(eq(userProgress.id, prev.id)).returning();
      } else {
        progressResult = await db.insert(userProgress).values({
          userId: currentUser.id,
          contentId,
          watchedPercent: watchedPercent || 0,
          quizScore: quizScore || 0,
          vocabReviewed: vocabReviewed || 0,
          xpEarned,
          completedAt: isCompleted ? new Date() : null,
        }).returning();
      }

      // Update user total XP
      if (xpEarned > 0) {
        await db.update(users).set({
          xp: (currentUser.xp || 0) + xpEarned,
        }).where(eq(users.id, currentUser.id));
      }

      return res.status(200).json(progressResult[0]);
    }

    // --- USER PROGRESS: Get all progress for current user ---
    if (pathname.match(/\/api\/progress$/) && method === 'GET') {
      if (!currentUser) return res.status(401).json([]);
      const results = await db.select().from(userProgress).where(eq(userProgress.userId, currentUser.id));
      return res.status(200).json(results);
    }

    // --- BADGES: List all badges ---
    if (pathname.match(/\/api\/badges$/) && method === 'GET') {
      const allBadges = await db.select().from(badges);
      if (!currentUser) return res.status(200).json({ badges: allBadges, earned: [] });
      
      const earned = await db.select().from(userBadges).where(eq(userBadges.userId, currentUser.id));
      return res.status(200).json({ badges: allBadges, earned });
    }

    // --- SAVED VOCABULARY: Save a word ---
    if (pathname.match(/\/api\/vocabulary$/) && method === 'POST') {
      if (!currentUser) return res.status(401).json({ error: "Unauthorized" });
      const { contentId, word, meaning, example } = body;
      if (!word || !meaning) return res.status(400).json({ error: "word and meaning are required" });
      
      try {
        const result = await db.insert(savedVocabulary).values({
          userId: currentUser.id,
          contentId: contentId || 0,
          word,
          meaning,
          example: example || null,
        }).returning();
        return res.status(201).json(result[0]);
      } catch (err: any) {
        if (err.code === '23505') return res.status(409).json({ error: "این لغت قبلاً ذخیره شده" });
        throw err;
      }
    }

    // --- SAVED VOCABULARY: Get user's vocabulary ---
    if (pathname.match(/\/api\/vocabulary$/) && method === 'GET') {
      if (!currentUser) return res.status(401).json([]);
      const results = await db.select().from(savedVocabulary)
        .where(eq(savedVocabulary.userId, currentUser.id))
        .orderBy(desc(savedVocabulary.createdAt));
      return res.status(200).json(results);
    }

    // --- SAVED VOCABULARY: Delete a saved word ---
    if (pathname.match(/\/api\/vocabulary\/\d+/) && method === 'DELETE') {
      if (!currentUser) return res.status(401).json({ error: "Unauthorized" });
      const idMatch = pathname.match(/\/api\/vocabulary\/(\d+)/);
      const vocabId = parseInt(idMatch![1]);
      await db.delete(savedVocabulary)
        .where(eq(savedVocabulary.id, vocabId));
      return res.status(200).json({ success: true });
    }

    // --- USER STATS: Combined dashboard data ---
    if (pathname.match(/\/api\/user\/stats$/) && method === 'GET') {
      if (!currentUser) return res.status(401).json({ error: "Unauthorized" });
      
      const progress = await db.select().from(userProgress).where(eq(userProgress.userId, currentUser.id));
      const earnedBadges = await db.select().from(userBadges).where(eq(userBadges.userId, currentUser.id));
      const vocabCount = await db.select().from(savedVocabulary).where(eq(savedVocabulary.userId, currentUser.id));
      
      const completedLessons = progress.filter(p => p.completedAt).length;
      const totalXp = currentUser.xp || 0;
      const avgQuizScore = progress.length > 0 
        ? Math.round(progress.reduce((sum, p) => sum + (p.quizScore || 0), 0) / progress.length) 
        : 0;

      return res.status(200).json({
        xp: totalXp,
        streak: currentUser.streak || 0,
        completedLessons,
        totalLessonsStarted: progress.length,
        avgQuizScore,
        savedVocabCount: vocabCount.length,
        badgesEarned: earnedBadges.length,
        level: currentUser.level || 'beginner',
      });
    }

    // ============ PHASE 3: GAMIFICATION ENDPOINTS ============

    // --- LEADERBOARD: Top users by XP ---
    if (pathname.match(/\/api\/leaderboard$/) && method === 'GET') {
      const topUsers = await db.select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        avatar: users.avatar,
        xp: users.xp,
        streak: users.streak,
        level: users.level,
      }).from(users).orderBy(desc(users.xp)).limit(50);

      // Determine current user's rank
      let myRank = null;
      if (currentUser) {
        const idx = topUsers.findIndex(u => u.id === currentUser.id);
        myRank = idx >= 0 ? idx + 1 : null;
      }

      return res.status(200).json({
        leaderboard: topUsers,
        myRank,
        myXp: currentUser?.xp || 0,
      });
    }

    // --- NOTIFICATIONS: Get user's notifications ---
    if (pathname.match(/\/api\/notifications$/) && method === 'GET') {
      if (!currentUser) return res.status(401).json([]);
      const results = await db.select().from(notifications)
        .where(eq(notifications.userId, currentUser.id))
        .orderBy(desc(notifications.createdAt))
        .limit(50);
      const unreadCount = results.filter(n => !n.isRead).length;
      return res.status(200).json({ notifications: results, unreadCount });
    }

    // --- NOTIFICATIONS: Mark single notification as read ---
    if (pathname.match(/\/api\/notifications\/\d+\/read/) && method === 'PATCH') {
      if (!currentUser) return res.status(401).json({ error: "Unauthorized" });
      const idMatch = pathname.match(/\/api\/notifications\/(\d+)\/read/);
      const notifId = parseInt(idMatch![1]);
      await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notifId));
      return res.status(200).json({ success: true });
    }

    // --- NOTIFICATIONS: Mark all as read ---
    if (pathname.match(/\/api\/notifications\/read-all/) && method === 'PATCH') {
      if (!currentUser) return res.status(401).json({ error: "Unauthorized" });
      await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, currentUser.id));
      return res.status(200).json({ success: true });
    }

    // --- WEEKLY CHALLENGES: List active challenges with user progress ---
    if (pathname.match(/\/api\/challenges$/) && method === 'GET') {
      const now = new Date();
      const activeChallenges = await db.select().from(weeklyChallenges)
        .where(eq(weeklyChallenges.isActive, true));
      
      let userProgressMap: Record<number, any> = {};
      if (currentUser) {
        const joined = await db.select().from(userChallenges)
          .where(eq(userChallenges.userId, currentUser.id));
        for (const uc of joined) {
          userProgressMap[uc.challengeId] = uc;
        }
      }

      const result = activeChallenges.map(ch => ({
        ...ch,
        userProgress: userProgressMap[ch.id] || null,
        isJoined: !!userProgressMap[ch.id],
        isCompleted: !!userProgressMap[ch.id]?.completedAt,
        percentDone: userProgressMap[ch.id] 
          ? Math.min(100, Math.round(((userProgressMap[ch.id].currentValue || 0) / (ch.targetValue || 1)) * 100))
          : 0,
      }));

      return res.status(200).json(result);
    }

    // --- WEEKLY CHALLENGES: Join a challenge ---
    if (pathname.match(/\/api\/challenges\/\d+\/join/) && method === 'POST') {
      if (!currentUser) return res.status(401).json({ error: "Unauthorized" });
      const idMatch = pathname.match(/\/api\/challenges\/(\d+)\/join/);
      const challengeId = parseInt(idMatch![1]);
      
      try {
        const result = await db.insert(userChallenges).values({
          userId: currentUser.id,
          challengeId,
          currentValue: 0,
        }).returning();
        return res.status(201).json(result[0]);
      } catch (err: any) {
        if (err.code === '23505') return res.status(409).json({ error: "قبلاً در این چالش شرکت کردید" });
        throw err;
      }
    }

    // --- WEEKLY CHALLENGES: Update challenge progress ---
    if (pathname.match(/\/api\/challenges\/\d+\/progress/) && method === 'PATCH') {
      if (!currentUser) return res.status(401).json({ error: "Unauthorized" });
      const idMatch = pathname.match(/\/api\/challenges\/(\d+)\/progress/);
      const challengeId = parseInt(idMatch![1]);
      const { increment } = body;

      const existing = await db.select().from(userChallenges)
        .where(and(eq(userChallenges.userId, currentUser.id), eq(userChallenges.challengeId, challengeId)));
      
      if (existing.length === 0) return res.status(404).json({ error: "ابتدا در چالش شرکت کنید" });
      
      const current = existing[0];
      if (current.completedAt) return res.status(200).json({ ...current, alreadyCompleted: true });
      
      const newValue = (current.currentValue || 0) + (increment || 1);
      
      // Get challenge target
      const challenge = await db.select().from(weeklyChallenges).where(eq(weeklyChallenges.id, challengeId));
      const isCompleted = challenge.length > 0 && newValue >= (challenge[0].targetValue || 1);

      const result = await db.update(userChallenges).set({
        currentValue: newValue,
        completedAt: isCompleted ? new Date() : null,
      }).where(eq(userChallenges.id, current.id)).returning();

      // If completed, grant XP reward
      if (isCompleted && challenge.length > 0) {
        const reward = challenge[0].xpReward || 0;
        await db.update(users).set({ xp: (currentUser.xp || 0) + reward }).where(eq(users.id, currentUser.id));
        
        // Create notification for completion
        await db.insert(notifications).values({
          userId: currentUser.id,
          type: 'achievement',
          title: '🎉 چالش تکمیل شد!',
          message: `تبریک! چالش «${challenge[0].title}» را تکمیل کردید و ${reward} XP دریافت کردید.`,
        });
      }

      return res.status(200).json(result[0]);
    }

    // --- WEEKLY REPORT: Get user's weekly progress summary ---
    if (pathname.match(/\/api\/user\/weekly-report$/) && method === 'GET') {
      if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Get all progress created/updated this week
      const weekProgress = await db.select().from(userProgress)
        .where(eq(userProgress.userId, currentUser.id));

      // Filter by week (since we can't do date comparison easily without gte import)
      const thisWeek = weekProgress.filter(p => p.updatedAt && new Date(p.updatedAt) >= oneWeekAgo);

      const lessonsThisWeek = thisWeek.length;
      const completedThisWeek = thisWeek.filter(p => p.completedAt && new Date(p.completedAt) >= oneWeekAgo).length;
      const xpThisWeek = thisWeek.reduce((sum, p) => sum + (p.xpEarned || 0), 0);
      const avgScore = thisWeek.length > 0
        ? Math.round(thisWeek.reduce((sum, p) => sum + (p.quizScore || 0), 0) / thisWeek.length)
        : 0;

      // Get vocab saved this week
      const weekVocab = await db.select().from(savedVocabulary)
        .where(eq(savedVocabulary.userId, currentUser.id));
      const vocabThisWeek = weekVocab.filter(v => v.createdAt && new Date(v.createdAt) >= oneWeekAgo).length;

      // Get challenges completed this week
      const weekChallenges = await db.select().from(userChallenges)
        .where(eq(userChallenges.userId, currentUser.id));
      const challengesCompleted = weekChallenges.filter(
        c => c.completedAt && new Date(c.completedAt) >= oneWeekAgo
      ).length;

      return res.status(200).json({
        period: { start: oneWeekAgo.toISOString(), end: new Date().toISOString() },
        lessonsStarted: lessonsThisWeek,
        lessonsCompleted: completedThisWeek,
        xpEarned: xpThisWeek,
        avgQuizScore: avgScore,
        vocabSaved: vocabThisWeek,
        challengesCompleted,
        streak: currentUser.streak || 0,
        totalXp: currentUser.xp || 0,
      });
    }

    // ============ PHASE 4: MONETIZATION ENDPOINTS ============

    // --- PLANS: Get available subscription plans ---
    if (pathname.match(/\/api\/payment\/plans$/) && method === 'GET') {
      return res.status(200).json(PLANS);
    }

    // --- SUBSCRIPTION: Get current status ---
    if (pathname.match(/\/api\/subscriptions$/) && method === 'GET') {
      if (!currentUser) return res.status(401).json({ error: "Unauthorized" });
      
      const activeSub = await db.select().from(subscriptions)
        .where(and(
          eq(subscriptions.userId, currentUser.id),
          eq(subscriptions.status, 'active')
        ))
        .orderBy(desc(subscriptions.endDate))
        .limit(1);

      return res.status(200).json({
        hasActiveSubscription: activeSub.length > 0 && new Date(activeSub[0].endDate) > new Date(),
        subscription: activeSub[0] || null,
      });
    }

    // --- PROMO CODE: Validate ---
    if (pathname.match(/\/api\/promo\/validate$/) && method === 'POST') {
      const { code } = body;
      const promo = await db.select().from(promoCodes).where(eq(promoCodes.code, code.toUpperCase()));
      
      if (promo.length === 0 || !promo[0].isActive) 
        return res.status(404).json({ error: "کد تخفیف نامعتبر است" });
      
      const p = promo[0];
      if (p.expiresAt && new Date(p.expiresAt) < new Date())
        return res.status(400).json({ error: "کد تخفیف منقضی شده است" });
      
      if (p.maxUses && (p.usedCount || 0) >= p.maxUses)
        return res.status(400).json({ error: "ظرفیت استفاده از این کد پر شده است" });

      return res.status(200).json(p);
    }

    // --- REFERRAL: Get stats and code ---
    // if (pathname.match(/\/api\/referral$/) && method === 'GET') {
    //   if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

    //   // Generate code if missing
    //   // if (!currentUser.referralCode) {
    //   //   const newCode = `REF-${currentUser.id}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    //   //   await db.update(users).set({ referralCode: newCode }).where(eq(users.id, currentUser.id));
    //   //   currentUser.referralCode = newCode;
    //   // }

    //   // const referredUsers = await db.select({ count: sql<number>`count(*)` })
    //   //   .from(users).where(eq(users.referredBy, currentUser.id));

    //   return res.status(200).json({
    //     // referralCode: currentUser.referralCode,
    //     // referredCount: referredUsers[0].count,
    //     // walletBalance: currentUser.walletBalance || 0,
    //     // referralLink: `${req.headers.origin}/auth?ref=${currentUser.referralCode}`,
    //   });
    // }

    // --- PAYMENT: Request (Real ZarinPal) ---
    if (pathname.match(/\/api\/payment\/request$/) && method === 'POST') {
      if (!currentUser) return res.status(401).json({ error: "Unauthorized" });
      const { planId, promoCode, classId } = body;

      let amount: number;
      let description: string;
      let callbackParams: string;
      let referenceSeed: string;
      let paymentClassId: number | null = null;

      if (classId) {
        // Group-class enrollment via gateway — gated behind ENABLE_ONLINE_CLASS_PAYMENT
        if (!isOnlineClassPaymentEnabled()) {
          return res.status(403).json({ error: "پرداخت آنلاین کلاس فعلاً غیرفعال است" });
        }
        const parsedClassId = parseInt(String(classId));
        if (!parsedClassId) return res.status(400).json({ error: "کلاس نامعتبر" });

        const clsRows = await db.select().from(classes).where(eq(classes.id, parsedClassId));
        if (clsRows.length === 0) return res.status(404).json({ error: "کلاس یافت نشد" });
        const cls = clsRows[0];

        const existing = await db.select().from(enrollments)
          .where(and(eq(enrollments.userId, currentUser.id), eq(enrollments.classId, parsedClassId)));
        if (existing.length > 0) return res.status(409).json({ error: "شما قبلاً در این کلاس ثبت‌نام کرده‌اید" });

        const countResult = await pool.query(`SELECT COUNT(*)::int AS cnt FROM enrollments WHERE class_id = $1`, [parsedClassId]);
        if (countResult.rows[0].cnt >= cls.capacity) {
          return res.status(409).json({ error: "ظرفیت کلاس تکمیل شده است" });
        }

        amount = cls.price;
        description = `ثبت‌نام کلاس ${cls.title} - Say It English`;
        callbackParams = `type=class&classId=${parsedClassId}`;
        referenceSeed = `CLASS-${parsedClassId}-${Date.now()}`;
        paymentClassId = parsedClassId;
      } else {
        // Subscription plan purchase (in Toman)
        const plan = planById(planId);
        if (!plan) return res.status(400).json({ error: "Plan invalid" });
        amount = plan.price;

        // Apply promo
        if (promoCode) {
          const promo = await db.select().from(promoCodes).where(eq(promoCodes.code, promoCode));
          if (promo.length > 0 && promo[0].isActive) {
            amount = Math.round(amount * (1 - promo[0].discountPercent / 100));
          }
        }
        description = `خرید پلن ${planId} - Say It English`;
        callbackParams = `planId=${planId}`;
        referenceSeed = `PLAN-${planId}-${Date.now()}`;
      }

      const ZARINPAL_MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID;
      if (!ZARINPAL_MERCHANT_ID) {
        return res.status(500).json({ error: "Payment gateway not configured. Set ZARINPAL_MERCHANT_ID in env." });
      }
      const ZARINPAL_SANDBOX = process.env.ZARINPAL_SANDBOX === 'true';
      const ZARINPAL_API_BASE = ZARINPAL_SANDBOX ? 'https://sandbox.zarinpal.com' : 'https://api.zarinpal.com';
      const ZARINPAL_STARTPAY_BASE = ZARINPAL_SANDBOX ? 'https://sandbox.zarinpal.com' : 'https://www.zarinpal.com';

      // Create payment record (pending) first so we have an id for the callback_url
      const payment = await db.insert(payments).values({
        userId: currentUser.id,
        classId: paymentClassId,
        amount,
        status: 'pending',
        gateway: 'zarinpal',
        referenceId: referenceSeed, // Temporary ref, overwritten below/after verify
      }).returning();

      const origin = req.headers.origin || `https://${req.headers.host}`;
      const callbackUrl = `${origin}/api/payment/verify?${callbackParams}&paymentId=${payment[0].id}`;

      try {
        const zpRes = await fetch(`${ZARINPAL_API_BASE}/pg/v4/payment/request.json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchant_id: ZARINPAL_MERCHANT_ID,
            amount,
            currency: 'IRT', // amounts in this app are in Toman
            callback_url: callbackUrl,
            description,
            metadata: currentUser.phone ? { mobile: currentUser.phone } : undefined,
          }),
        });
        const zpData = await zpRes.json();

        if (zpData?.data?.code === 100 && zpData?.data?.authority) {
          await db.update(payments).set({ referenceId: zpData.data.authority }).where(eq(payments.id, payment[0].id));
          return res.status(200).json({
            url: `${ZARINPAL_STARTPAY_BASE}/pg/StartPay/${zpData.data.authority}`,
            authority: zpData.data.authority,
          });
        }

        await db.update(payments).set({ status: 'failed' }).where(eq(payments.id, payment[0].id));
        console.error("[ZARINPAL REQUEST ERROR]", zpData?.errors);
        return res.status(502).json({ error: "درخواست پرداخت ناموفق بود", details: zpData?.errors });
      } catch (err: any) {
        await db.update(payments).set({ status: 'failed' }).where(eq(payments.id, payment[0].id));
        console.error("[ZARINPAL REQUEST ERROR]", err);
        return res.status(502).json({ error: "ارتباط با درگاه پرداخت برقرار نشد", details: err.message });
      }
    }

    // --- PAYMENT: Verify (Real ZarinPal) ---
    if (pathname.match(/\/api\/payment\/verify$/) && method === 'GET') {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const authority = url.searchParams.get('Authority');
      const status = url.searchParams.get('Status');
      const type = url.searchParams.get('type'); // 'class' for group-class enrollment, else subscription plan
      const planId = url.searchParams.get('planId');
      const classIdParam = url.searchParams.get('classId');
      const paymentIdParam = url.searchParams.get('paymentId');
      // Only used for the cheap pre-fetch sanity check below — the actual authorization
      // decision uses the payment record's own classId once it's loaded (see below).
      const requestedClassPayment = type === 'class';

      if (!authority || status !== 'OK' || !paymentIdParam || (requestedClassPayment ? !classIdParam : !planId)) {
        return res.redirect('/payment/failed');
      }

      const paymentId = parseInt(paymentIdParam);
      const paymentRows = await db.select().from(payments).where(eq(payments.id, paymentId));
      if (paymentRows.length === 0) return res.redirect('/payment/failed');
      const payment = paymentRows;

      // Authoritative: what this payment record was actually created for, not the
      // client-supplied query params (which could be tampered with to enroll in a
      // different, more expensive class than the one actually paid for).
      const verifiedClassId = payment[0].classId;
      const isClassPayment = verifiedClassId != null;

      if (payment[0].status === 'approved') {
         return res.redirect(isClassPayment ? '/dashboard?enrollment=success' : '/dashboard?payment=success');
      }

      const ZARINPAL_MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID;
      if (!ZARINPAL_MERCHANT_ID) return res.redirect('/payment/failed');
      const ZARINPAL_SANDBOX = process.env.ZARINPAL_SANDBOX === 'true';
      const ZARINPAL_API_BASE = ZARINPAL_SANDBOX ? 'https://sandbox.zarinpal.com' : 'https://api.zarinpal.com';

      let zpData: any;
      try {
        const zpRes = await fetch(`${ZARINPAL_API_BASE}/pg/v4/payment/verify.json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchant_id: ZARINPAL_MERCHANT_ID,
            authority,
            amount: payment[0].amount,
            currency: 'IRT',
          }),
        });
        zpData = await zpRes.json();
      } catch (err) {
        console.error("[ZARINPAL VERIFY ERROR]", err);
        return res.redirect('/payment/failed');
      }

      // 100 = verified now, 101 = already verified previously (treat both as success)
      if (zpData?.data?.code !== 100 && zpData?.data?.code !== 101) {
        await db.update(payments).set({ status: 'failed' }).where(eq(payments.id, paymentId));
        console.error("[ZARINPAL VERIFY FAILED]", zpData?.errors);
        return res.redirect('/payment/failed');
      }

      // Approve payment
      await db.update(payments).set({ status: 'approved', referenceId: zpData.data.ref_id?.toString() || authority })
        .where(eq(payments.id, paymentId));

      // Group-class enrollment
      if (isClassPayment) {
        const outcome = await grantClassEnrollment(payment[0].userId, verifiedClassId!);
        if (outcome === 'full') {
          // Paid but the seat vanished between request and verify — flag for manual refund
          try {
            await db.insert(notifications).values({
              userId: payment[0].userId,
              type: 'info',
              title: '⚠️ ظرفیت کلاس تکمیل شد',
              message: 'پرداخت شما موفق بود اما ظرفیت کلاس پیش از تایید تکمیل شد. مبلغ بازگردانده می‌شود؛ پشتیبانی با شما تماس می‌گیرد.',
              link: '/dashboard',
            });
            const admins = await db.select().from(users).where(eq(users.role, 'admin'));
            for (const admin of admins) {
              await db.insert(notifications).values({
                userId: admin.id,
                type: 'info',
                title: '⚠️ نیاز به بازپرداخت',
                message: `پرداخت #${paymentId} برای کلاس #${verifiedClassId} موفق بود اما ظرفیت تکمیل شده — بازپرداخت دستی لازم است.`,
                link: '/admin/payments',
              });
            }
          } catch (e) {
            console.error('[CLASS FULL NOTIFY ERROR]', e);
          }
          return res.redirect('/dashboard?enrollment=full');
        }
        return res.redirect('/dashboard?enrollment=success');
      }

      // Create Subscription
      const durationDays = planById(planId)?.durationDays ?? 30;
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + durationDays);

      await db.insert(subscriptions).values({
        userId: payment[0].userId,
        planId: planId!, // non-null here: the class branch returned above, and the guard rejected missing planId
        status: 'active',
        startDate,
        endDate,
        paymentId,
      });

      // Handle Referral Reward (if user was referred)
      // const user = await db.select().from(users).where(eq(users.id, payment[0].userId));
      // if (user[0].referredBy) {
      //   // Give 10% to referrer
      //   const reward = Math.round(payment[0].amount * 0.1);
      //   const referrer = await db.select().from(users).where(eq(users.id, user[0].referredBy));
      //   if (referrer.length > 0) {
      //      await db.update(users)
      //        .set({ walletBalance: (referrer[0].walletBalance || 0) + reward })
      //        .where(eq(users.id, referrer[0].id));
      //      
      //      // Notify referrer
      //      await db.insert(notifications).values({
      //        userId: referrer[0].id,
      //        type: 'achievement',
      //        title: '💰 پاداش معرفی',
      //        message: `یکی از دوستان شما خرید کرد! مبلغ ${reward} تومان به کیف پول شما اضافه شد.`,
      //      });
      //   }
      // }

      return res.redirect('/dashboard?payment=success&plan=' + planId);
    }

    // ============ ADMIN ENDPOINTS ============
    
    // --- ADMIN: Analytics Stats ---
    if (pathname === '/api/admin/stats' && method === 'GET') {
      if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      
      const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
      const totalContent = await db.select({ count: sql<number>`count(*)` }).from(content);
      const totalPayments = await db.select({ count: sql<number>`count(*)` }).from(payments);
      const totalRevenue = await db.select({ sum: sql<number>`COALESCE(sum(amount), 0)` }).from(payments).where(eq(payments.status, 'approved'));
      const activeSubscriptions = await db.select({ count: sql<number>`count(*)` }).from(subscriptions).where(eq(subscriptions.status, 'active'));
      const totalPromos = await db.select({ count: sql<number>`count(*)` }).from(promoCodes);
      
      // Last 7 days revenue
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekRevenue = await db.select({ sum: sql<number>`COALESCE(sum(amount), 0)` })
        .from(payments)
        .where(and(eq(payments.status, 'approved'), sql`${payments.createdAt} >= ${weekAgo}`));
      
      // Recent payments
      const recentPayments = await db.select().from(payments)
        .orderBy(desc(payments.createdAt)).limit(5);
      
      return res.status(200).json({
        totalUsers: totalUsers[0]?.count || 0,
        totalContent: totalContent[0]?.count || 0,
        totalPayments: totalPayments[0]?.count || 0,
        totalRevenue: totalRevenue[0]?.sum || 0,
        activeSubscriptions: activeSubscriptions[0]?.count || 0,
        totalPromos: totalPromos[0]?.count || 0,
        weekRevenue: weekRevenue[0]?.sum || 0,
        recentPayments,
      });
    }
    
    // --- ADMIN: List All Subscriptions ---
    if (pathname === '/api/admin/subscriptions' && method === 'GET') {
      if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      const allSubs = await db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt));
      
      // Enrich with user info
      const enriched = await Promise.all(allSubs.map(async (sub) => {
        const user = await db.select({ id: users.id, username: users.username, phone: users.phone }).from(users).where(eq(users.id, sub.userId));
        return { ...sub, user: user[0] || null };
      }));
      
      return res.status(200).json(enriched);
    }

    // --- ADMIN: Cancel Subscription ---
    if (pathname.match(/\/api\/admin\/subscriptions\/\d+\/cancel/) && method === 'POST') {
      if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      const idMatch = pathname.match(/\/api\/admin\/subscriptions\/(\d+)\/cancel/);
      const subId = parseInt(idMatch![1]);
      await db.update(subscriptions).set({ status: 'cancelled' }).where(eq(subscriptions.id, subId));
      return res.status(200).json({ success: true });
    }
    
    // --- ADMIN: List Promo Codes ---
    if (pathname === '/api/admin/promos' && method === 'GET') {
      if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      const allPromos = await db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
      return res.status(200).json(allPromos);
    }
    
    // --- ADMIN: Create Promo Code ---
    if (pathname === '/api/admin/promos' && method === 'POST') {
      if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      const { code, discountPercent, maxUses, expiresAt } = body;
      if (!code || !discountPercent) return res.status(400).json({ error: "code and discountPercent required" });
      
      const newPromo = await db.insert(promoCodes).values({
        code: code.toUpperCase(),
        discountPercent: parseInt(discountPercent),
        maxUses: maxUses ? parseInt(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
      }).returning();
      
      return res.status(201).json(newPromo[0]);
    }
    
    // --- ADMIN: Toggle Promo Code ---
    if (pathname.match(/\/api\/admin\/promos\/\d+\/toggle/) && method === 'POST') {
      if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      const idMatch = pathname.match(/\/api\/admin\/promos\/(\d+)\/toggle/);
      const promoId = parseInt(idMatch![1]);
      const promo = await db.select().from(promoCodes).where(eq(promoCodes.id, promoId));
      if (promo.length === 0) return res.status(404).json({ error: "Not found" });
      
      await db.update(promoCodes).set({ isActive: !promo[0].isActive }).where(eq(promoCodes.id, promoId));
      return res.status(200).json({ success: true, isActive: !promo[0].isActive });
    }
    
    // --- ADMIN: Delete Promo Code ---
    if (pathname.match(/\/api\/admin\/promos\/\d+$/) && method === 'DELETE') {
      if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      const idMatch = pathname.match(/\/api\/admin\/promos\/(\d+)/);
      const promoId = parseInt(idMatch![1]);
      await db.delete(promoCodes).where(eq(promoCodes.id, promoId));
      return res.status(200).json({ success: true });
    }

    // --- AUTH ROUTES ---
    if (pathname.includes('/otp/request') && method === 'POST') {
      const parsed = phoneSchema.safeParse(body);
      if (!parsed.success) return res.status(400).json({ error: "شماره موبایل نامعتبر است" });
      const { phone } = parsed.data;
      
      // Rate limit OTP requests
      const ip = (req.headers['x-forwarded-for'] as string || 'unknown').split(',')[0].trim();
      if (!(await checkRateLimit(`otp:${ip}`, 5, 120000))) {
        return res.status(429).json({ error: "تعداد درخواست‌ها بیش از حد مجاز. ۲ دقیقه صبر کنید." });
      }
      
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
      
      const results = await db.select().from(users).where(or(eq(users.phone, phone), eq(users.username, phone)));
      let user = results[0];
      
      // If multiple users found, try to pick the best match (e.g. username matches phone)
      if (results.length > 1) {
          const usernameMatch = results.find(u => u.username === phone);
          const phoneMatch = results.find(u => u.phone === phone);
          // Prefer username match if it exists and isn't just an auto-generated one (though auto-gen is usually user_phone)
          // Actually, if username matches the phone exactly, that's likely the "intended" login.
          user = usernameMatch || phoneMatch || results[0];
      }

      const ADMIN_PHONES = ["09222453571", "09123104254"];
      const isAdmin = ADMIN_PHONES.includes(phone);

      if (!user) {
        // Only create if NO user found matching phone OR username
        const insertResults = await db.insert(users).values({
          username: `user_${phone}`,
          phone,
          role: isAdmin ? "admin" : "user",
        }).returning();
        user = insertResults[0];
      }
      
      // Ensure we have a user from the list or created
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
      if (!(await checkRateLimit(`verify:${ip}`, 10, 120000))) {
        return res.status(429).json({ error: "تعداد تلاش‌ها بیش از حد مجاز. ۲ دقیقه صبر کنید." });
      }
      
      const results = await db.select().from(users).where(or(eq(users.phone, phone), eq(users.username, phone)));
      
      // Find the user with the correct OTP
      const user = results.find(u => u.otp === otp && u.otpExpires && new Date(u.otpExpires) >= new Date());

      if (!user) {
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
      if (!(await checkRateLimit(`login:${ip}`, 10, 120000))) {
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

    // ============ ADMIN: DIRECT S3 UPLOAD ============
    // POST /api/admin/upload — Upload file to ArvanCloud S3 private bucket
    // Returns { fileKey, publicUrl } for use in content creation form.
    if (pathname === '/api/admin/upload' && method === 'POST') {
      if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Forbidden" });

      const {
        fileName,      // original file name
        fileType,      // MIME type (e.g. "video/mp4")
        fileSize,      // bytes
        folder = 'videos', // 'videos' | 'audio' | 'images'
      } = body;

      if (!fileName || !fileType) {
        return res.status(400).json({ error: "fileName and fileType are required" });
      }

      // ARVAN_* are the names actually set in Vercel (and in .env); the ARVAN_S3_* names this
      // code was written against were never set there, so storage 500'd on production.
      const AWS_ENDPOINT = process.env.ARVAN_S3_ENDPOINT || process.env.ARVAN_ENDPOINT || 'https://s3.ir-thr-at1.arvanstorage.ir';
      const AWS_BUCKET   = process.env.ARVAN_S3_BUCKET || process.env.ARVAN_BUCKET_NAME || '';
      const AWS_KEY      = process.env.ARVAN_S3_ACCESS_KEY || process.env.ARVAN_ACCESS_KEY || '';
      const AWS_SECRET   = process.env.ARVAN_S3_SECRET_KEY || process.env.ARVAN_SECRET_KEY || '';

      if (!AWS_BUCKET || !AWS_KEY || !AWS_SECRET) {
        return res.status(500).json({ error: "Storage credentials not configured. Set ARVAN_BUCKET_NAME, ARVAN_ACCESS_KEY, ARVAN_SECRET_KEY (or the ARVAN_S3_* aliases) in env." });
      }

      try {
        // Dynamically import to avoid bundling issues in edge
        const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
        const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

        const s3 = new S3Client({
          region: "ir-thr-at1",
          endpoint: AWS_ENDPOINT,
          credentials: { accessKeyId: AWS_KEY, secretAccessKey: AWS_SECRET },
          forcePathStyle: true,
        });

        // Build a unique key: e.g. videos/2026-05-24_uuid_filename.mp4
        const ext = fileName.split('.').pop() || 'bin';
        const uuid = randomBytes(8).toString('hex');
        const date = new Date().toISOString().split('T')[0];
        const fileKey = `${folder}/${date}_${uuid}.${ext}`;

        const command = new PutObjectCommand({
          Bucket: AWS_BUCKET,
          Key: fileKey,
          ContentType: fileType,
          ContentLength: fileSize ? parseInt(fileSize) : undefined,
        });

        // Generate a presigned PUT URL valid for 30 minutes
        const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 1800 });

        return res.status(200).json({
          uploadUrl,          // PUT this URL directly from the browser
          fileKey,            // Store in DB as content.fileKey
          bucket: AWS_BUCKET,
          endpoint: AWS_ENDPOINT,
        });
      } catch (err: any) {
        console.error("[S3 UPLOAD ERROR]", err);
        return res.status(500).json({ error: "Failed to generate upload URL", details: err.message });
      }
    }

    // ============ AI: SPEAKING BUDDY ANALYSIS ============
    // POST /api/ai/speaking — Analyse user's spoken audio for pronunciation & grammar
    // Body: { transcribedText: string, targetPhrase?: string, level?: string }
    // Returns structured feedback from Gemini
    if (pathname === '/api/ai/speaking' && method === 'POST') {
      if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

      const { transcribedText, targetPhrase, level = 'intermediate' } = body;
      if (!transcribedText || transcribedText.trim().length < 2) {
        return res.status(400).json({ error: "transcribedText is required" });
      }

      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
      if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: "AI service not configured. Set GEMINI_API_KEY in env." });
      }

      // Rate limit AI calls: max 10 per minute per user
      if (!(await checkRateLimit(`ai:${currentUser.id}`, 10, 60000))) {
        return res.status(429).json({ error: "Too many requests. Please wait a moment." });
      }

      const systemPrompt = `You are an expert American English pronunciation and grammar coach.
Analyze the student's spoken English and provide concise, encouraging feedback in JSON format.
The student's English level is: ${level}.
${targetPhrase ? `Target phrase they were trying to say: "${targetPhrase}"` : ''}

Respond ONLY with valid JSON in this exact structure:
{
  "overallScore": <number 0-100>,
  "pronunciation": {
    "score": <number 0-100>,
    "issues": [<string>],
    "tips": [<string>]
  },
  "grammar": {
    "score": <number 0-100>,
    "corrections": [{"original": "<string>", "corrected": "<string>", "explanation": "<string>"}]
  },
  "vocabulary": {
    "goodWords": [<string>],
    "suggestions": [{"replace": "<string>", "with": "<string>"}]
  },
  "encouragement": "<short motivational message in Persian>",
  "nativeSuggestion": "<how a native speaker would naturally say this>"
}`;

      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `Student said: "${transcribedText}"` }] }],
              systemInstruction: { parts: [{ text: systemPrompt }] },
              generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
            }),
          }
        );

        if (!geminiRes.ok) {
          const errText = await geminiRes.text();
          throw new Error(`Gemini API error: ${errText}`);
        }

        const geminiData = await geminiRes.json();
        const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

        let feedback;
        try {
          feedback = JSON.parse(rawText);
        } catch {
          feedback = { overallScore: 0, encouragement: "تحلیل در دسترس نیست. دوباره امتحان کنید.", raw: rawText };
        }

        // Award XP for practicing speaking (5 XP per session)
        await db.update(users).set({ xp: (currentUser.xp || 0) + 5 }).where(eq(users.id, currentUser.id));

        return res.status(200).json({ ...feedback, xpEarned: 5 });
      } catch (err: any) {
        console.error("[AI SPEAKING ERROR]", err);
        return res.status(500).json({ error: "AI analysis failed", details: err.message });
      }
    }

    // ============ AI: SUPPORT CHAT (AvalAI) ============
    // POST /api/chat — General site FAQ/support chat, public (no login required).
    // Uses AvalAI's OpenAI-compatible gateway (https://api.avalai.ir/v1/chat/completions),
    // which routes to GPT/Claude/Gemini depending on AVALAI_MODEL.
    if (pathname === '/api/chat' && method === 'POST') {
      const parsed = chatMessageSchema.safeParse(body);
      if (!parsed.success) return res.status(400).json({ error: "پیام نامعتبر است" });
      const { message } = parsed.data;

      const ip = (req.headers['x-forwarded-for'] as string || 'unknown').split(',')[0].trim();
      if (!(await checkRateLimit(`chat:${ip}`, 15, 60000))) {
        return res.status(429).json({ error: "تعداد پیام‌ها بیش از حد مجاز. کمی صبر کنید." });
      }

      const AVALAI_API_KEY = process.env.AVALAI_API_KEY;
      if (!AVALAI_API_KEY) {
        return res.status(500).json({ error: "AI service not configured. Set AVALAI_API_KEY in env." });
      }

      const AVALAI_BASE_URL = process.env.AVALAI_BASE_URL || 'https://api.avalai.ir/v1';
      // Exact model id string depends on your AvalAI plan/catalog (GPT/Claude/Gemini all
      // go through this same endpoint) — set AVALAI_MODEL to override the default.
      const AVALAI_MODEL = process.env.AVALAI_MODEL || 'gpt-4o-mini';

      // Grounded in real facts already in this codebase (pricing endpoint, site routes) so the
      // bot can actually answer common questions instead of refusing everything. Explicitly
      // told not to invent anything beyond this list — see audit_report.md's critique of the
      // old "still learning" placeholder persona.
      const systemPrompt = `تو دستیار پشتیبانی سایت آموزش زبان انگلیسی "Say It English" هستی. همیشه به فارسی و مودبانه پاسخ بده.

اطلاعات واقعی سایت که می‌تونی برای پاسخ به سوالات ازشون استفاده کنی:

**پلن‌های اشتراک (صفحه /pricing):**
${PLANS_TEXT}
- پرداخت آنلاین از طریق درگاه زرین‌پال انجام می‌شود.

**بخش‌های اصلی سایت:**
- /placement — تست تعیین سطح رایگان
- /videos و /content — ویدیوها و محتوای آموزشی (بخشی رایگان، بخشی نیازمند خرید/اشتراک)
- /blog — مقالات آموزشی
- /bookings — رزرو وقت مشاوره یا کلاس خصوصی (زمان‌های خالی را کاربر انتخاب و رزرو می‌کند)
- /dashboard — پیشرفت یادگیری، XP، و لغات ذخیره‌شده کاربر
- /leaderboard و /challenges — رتبه‌بندی و چالش‌های هفتگی

**ورود به سایت:** با شماره موبایل (کد تایید پیامکی) یا نام کاربری/رمز عبور.

اگر سوالی خارج از این اطلاعات پرسیده شد (مثلاً جزئیات خیلی خاص که اینجا نیامده)، صادقانه بگو که مطمئن نیستی و پیشنهاد بده کاربر بخش مربوطه در سایت را ببیند یا از پشتیبانی بپرسد. هرگز قیمت، تاریخ، یا امکاناتی که در بالا نیامده را حدس نزن یا از خودت نساز.`;

      try {
        const avalRes = await fetch(`${AVALAI_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AVALAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: AVALAI_MODEL,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message },
            ],
            temperature: 0.4,
          }),
        });

        if (!avalRes.ok) {
          const errText = await avalRes.text();
          throw new Error(`AvalAI API error (${avalRes.status}): ${errText}`);
        }

        const avalData = await avalRes.json();
        const reply = avalData?.choices?.[0]?.message?.content
          || 'دارم اطلاعات کامل رو یاد می‌گیرم، به‌زودی می‌تونم بهتر کمکت کنم!';

        return res.status(200).json({ reply });
      } catch (err: any) {
        console.error("[CHAT ERROR]", err);
        return res.status(500).json({ error: "پاسخ‌گویی چت با خطا مواجه شد", details: err.message });
      }
    }

    // ============ AI: INSTAGRAM DM DRAFTER (AvalAI, HITL) ============
    // POST /api/ig/draft — private, token-gated tool for the teacher's wife: takes a
    // student's Instagram DM/comment (pasted manually) and returns an AI draft reply.
    // Nothing is ever sent to Instagram programmatically — she reviews, edits, and
    // sends it herself (HITL, ADR-012). Requires IG_DRAFT_TOKEN; without the env set,
    // the endpoint stays closed (401) so it can never accidentally go public.
    if (pathname === '/api/ig/draft' && method === 'POST') {
      if (!checkIgDraftAuth(req)) {
        return res.status(401).json({ error: "احراز هویت نشد" });
      }

      const parsed = igDraftInputSchema.safeParse(body);
      if (!parsed.success) return res.status(400).json({ error: "پیام ورودی نامعتبر است" });
      const { inbound, context, studentHandle } = parsed.data;

      // Single-user token — a static key is enough (looser than /api/chat's per-IP limit).
      if (!(await checkRateLimit(`ig-draft:owner`, 30, 60000))) {
        return res.status(429).json({ error: "تعداد درخواست‌ها بیش از حد مجاز. کمی صبر کنید." });
      }

      const AVALAI_API_KEY = process.env.AVALAI_API_KEY;
      if (!AVALAI_API_KEY) {
        return res.status(500).json({ error: "AI service not configured. Set AVALAI_API_KEY in env." });
      }
      const AVALAI_BASE_URL = process.env.AVALAI_BASE_URL || 'https://api.avalai.ir/v1';
      const AVALAI_MODEL = process.env.AVALAI_MODEL || 'gpt-4o-mini';

      // Tone/format rules come from .claude/agents/english-content.md (Instagram reply
      // template): short, warm, Persian, clear CTA, and serious/financial questions get
      // deferred to a human follow-up instead of an invented answer. Facts (plans,
      // routes) mirror the /api/chat prompt above — keep the two in sync.
      const systemPrompt = `تو به همسر آقای H (مدرس سایت آموزش زبان "Say It English") کمک می‌کنی تا به پیام‌ها و کامنت‌های اینستاگرام دانش‌آموزان و علاقه‌مندان پاسخ بدهد.

خروجی تو یک «پیش‌نویس» است: او آن را می‌خواند، در صورت نیاز ویرایش می‌کند و خودش از اکانت اینستاگرام می‌فرستد. پس فقط متن نهایی و آمادهٔ ارسال را بنویس — بدون مقدمه، توضیح یا گزینه‌های متعدد.

قواعد لحن و قالب:
- همیشه فارسی، گرم، صمیمی و مودبانه — از زبان خود او (اول‌شخص)، کوتاه و مناسب اینستاگرام.
- پیام‌های تکراری (قیمت، تعیین سطح، وضعیت ثبت‌نام کلاس) را کامل و شفاف جواب بده.
- اگر سوال جدی/مالی/خاص است و پاسخ قطعی آن را نداری، صادقانه بنویس «بذار دقیق بررسی کنم و بهت خبر می‌دم» — هرگز قیمت، تاریخ، تخفیف یا امکاناتی که در اطلاعات زیر نیامده را از خودت نساز.
- تخفیف یا قول قطعی نده مگر در متن ورودی صریحاً خواسته شده باشد.
- فقط اگر به موضوع پیام مرتبط بود، در پایان یک دعوت ملایم به تعیین سطح رایگان یا کلاس‌های گروهی اضافه کن.
- لینک‌ها را همیشه کامل بنویس (پیام در اینستاگرام paste می‌شود و مسیر نسبی به درد نمی‌خورد).

اطلاعات واقعی سایت:
- پلن‌ها (https://say-it-english.vercel.app/pricing) — پرداخت آنلاین با زرین‌پال:
${PLANS_TEXT}
- تست تعیین سطح رایگان: https://say-it-english.vercel.app/placement
- کلاس‌های گروهی و ثبت‌نام: https://say-it-english.vercel.app/classes — زمان‌بندی و ظرفیت هر کلاس در همان صفحه است؛ عدد یا تاریخی خارج از آن نگو.
- رزرو مشاوره یا کلاس خصوصی: https://say-it-english.vercel.app/bookings

نوع پیام ورودی: ${context === 'comment' ? 'کامنت عمومی زیر پست' : 'دایرکت (DM)'}${studentHandle ? ` — از طرف ${studentHandle}` : ''}`;

      try {
        const avalRes = await fetch(`${AVALAI_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AVALAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: AVALAI_MODEL,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: inbound },
            ],
            temperature: 0.5,
          }),
        });

        if (!avalRes.ok) {
          const errText = await avalRes.text();
          throw new Error(`AvalAI API error (${avalRes.status}): ${errText}`);
        }

        const avalData = await avalRes.json();
        const draft = avalData?.choices?.[0]?.message?.content;
        if (!draft) {
          return res.status(502).json({ error: "پیش‌نویس خالی برگشت — دوباره تلاش کنید." });
        }

        const [row] = await db.insert(igDrafts).values({
          inbound,
          context: context ?? null,
          studentHandle: studentHandle ?? null,
          draft,
          sentStatus: 'drafted',
        }).returning();

        return res.status(200).json({ id: row.id, draft });
      } catch (err: any) {
        console.error("[IG DRAFT ERROR]", err);
        return res.status(500).json({ error: "تولید پیش‌نویس با خطا مواجه شد", details: err.message });
      }
    }

    // PATCH /api/ig/draft/:id — log the outcome of a draft (edited text / sent / discarded)
    // so the drafts table becomes a usable dataset for prompt tuning later.
    if (pathname.startsWith('/api/ig/draft/') && method === 'PATCH') {
      if (!checkIgDraftAuth(req)) {
        return res.status(401).json({ error: "احراز هویت نشد" });
      }

      const draftId = parseInt(pathname.slice('/api/ig/draft/'.length), 10);
      if (isNaN(draftId)) return res.status(400).json({ error: "شناسه نامعتبر است" });

      const parsed = igDraftUpdateSchema.safeParse(body);
      if (!parsed.success || (parsed.data.edited === undefined && parsed.data.sentStatus === undefined)) {
        return res.status(400).json({ error: "بدنهٔ درخواست نامعتبر است" });
      }

      try {
        const updates: Record<string, any> = {};
        if (parsed.data.edited !== undefined) updates.edited = parsed.data.edited;
        if (parsed.data.sentStatus !== undefined) updates.sentStatus = parsed.data.sentStatus;

        const [row] = await db.update(igDrafts).set(updates).where(eq(igDrafts.id, draftId)).returning();
        if (!row) return res.status(404).json({ error: "پیش‌نویس پیدا نشد" });

        return res.status(200).json(row);
      } catch (err: any) {
        console.error("[IG DRAFT PATCH ERROR]", err);
        return res.status(500).json({ error: "ثبت وضعیت با خطا مواجه شد", details: err.message });
      }
    }

    // Default 404
    console.log(`[API 404] Method: ${method}, URL: ${req.url}, Path: ${pathname}`);
    return res.status(404).json({ error: 'Not Found' });

  } catch (err: any) {
    console.error("[API ERROR]", err);
    return res.status(500).json({ error: "Server Error", message: err.message });
  }
}
