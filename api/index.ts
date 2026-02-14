
import { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { eq, ilike, and, desc, sql } from "drizzle-orm";
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
  xp: integer("xp").default(0),
  lastSeenAt: timestamp("last_seen_at"),
  sessionToken: text("session_token"),
  otp: text("otp"),
  otpExpires: timestamp("otp_expires"),
  referralCode: text("referral_code").unique(),
  referredBy: integer("referred_by"),
  walletBalance: integer("wallet_balance").default(0),
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
  updatedAt: timestamp("updated_at").defaultNow(),
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
          if (updatedPayment.contentId) {
            await db.insert(purchases).values({
                userId: updatedPayment.userId,
                contentId: updatedPayment.contentId
            });
          }
      }
      
      return res.status(200).json(updatedPayment);
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
      return res.status(200).json([
        { id: 'bronze', name: 'برنزی', price: 99000, durationDays: 30, features: ['دسترسی به تمام ویدیوها', 'آزمون‌های نامحدود'] },
        { id: 'silver', name: 'نقره‌ای', price: 249000, durationDays: 90, features: ['تمام امکانات برنزی', 'پشتیبانی اختصاصی', 'نشان نقره‌ای'] },
        { id: 'gold', name: 'طلایی', price: 890000, durationDays: 365, features: ['تمام امکانات نقره‌ای', 'مشاوره آنلاین', 'نشان طلایی'] },
      ]);
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
    if (pathname.match(/\/api\/referral$/) && method === 'GET') {
      if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

      // Generate code if missing
      if (!currentUser.referralCode) {
        const newCode = `REF-${currentUser.id}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        await db.update(users).set({ referralCode: newCode }).where(eq(users.id, currentUser.id));
        currentUser.referralCode = newCode;
      }

      const referredUsers = await db.select({ count: sql<number>`count(*)` })
        .from(users).where(eq(users.referredBy, currentUser.id));

      return res.status(200).json({
        referralCode: currentUser.referralCode,
        referredCount: referredUsers[0].count,
        walletBalance: currentUser.walletBalance || 0,
        referralLink: `${req.headers.origin}/auth?ref=${currentUser.referralCode}`,
      });
    }

    // --- PAYMENT: Request (Mock ZarinPal) ---
    if (pathname.match(/\/api\/payment\/request$/) && method === 'POST') {
      if (!currentUser) return res.status(401).json({ error: "Unauthorized" });
      const { planId, promoCode } = body;

      // Calculate price
      const plans: Record<string, number> = { 'bronze': 99000, 'silver': 249000, 'gold': 890000 };
      let amount = plans[planId];
      if (!amount) return res.status(400).json({ error: "Plan invalid" });

      // Apply promo
      if (promoCode) {
        const promo = await db.select().from(promoCodes).where(eq(promoCodes.code, promoCode));
        if (promo.length > 0 && promo[0].isActive) {
          amount = Math.round(amount * (1 - promo[0].discountPercent / 100));
        }
      }

      // Create payment record (pending)
      const payment = await db.insert(payments).values({
        userId: currentUser.id,
        amount,
        status: 'pending',
        gateway: 'zarinpal',
        referenceId: `PLAN-${planId}-${Date.now()}`, // Temporary ref
      }).returning();

      // MOCK: Return a verification URL directly for testing
      // In production, this would request ZarinPal and return their gateway URL
      return res.status(200).json({
        url: `${req.headers.origin}/api/payment/verify?Authority=${payment[0].id}&Status=OK&PlanId=${planId}`,
        authority: payment[0].id.toString()
      });
    }

    // --- PAYMENT: Verify (Mock) ---
    if (pathname.match(/\/api\/payment\/verify$/) && method === 'GET') {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const authority = url.searchParams.get('Authority'); // Using payment ID as Authority for mock
      const status = url.searchParams.get('Status');
      const planId = url.searchParams.get('PlanId');

      if (!authority || status !== 'OK' || !planId) {
        return res.redirect('/payment/failed');
      }

      const paymentId = parseInt(authority);
      const payment = await db.select().from(payments).where(eq(payments.id, paymentId));

      if (payment.length === 0 || payment[0].status === 'approved') {
         return res.redirect('/dashboard?payment=success');
      }

      // Approve payment
      await db.update(payments).set({ status: 'approved', referenceId: `REF-${Date.now()}` })
        .where(eq(payments.id, paymentId));

      // Create Subscription
      const durationDays = planId === 'gold' ? 365 : (planId === 'silver' ? 90 : 30);
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + durationDays);

      await db.insert(subscriptions).values({
        userId: payment[0].userId,
        planId: planId,
        status: 'active',
        startDate,
        endDate,
        paymentId,
      });

      // Handle Referral Reward (if user was referred)
      const user = await db.select().from(users).where(eq(users.id, payment[0].userId));
      if (user[0].referredBy) {
        // Give 10% to referrer
        const reward = Math.round(payment[0].amount * 0.1);
        const referrer = await db.select().from(users).where(eq(users.id, user[0].referredBy));
        if (referrer.length > 0) {
           await db.update(users)
             .set({ walletBalance: (referrer[0].walletBalance || 0) + reward })
             .where(eq(users.id, referrer[0].id));
           
           // Notify referrer
           await db.insert(notifications).values({
             userId: referrer[0].id,
             type: 'achievement',
             title: '💰 پاداش معرفی',
             message: `یکی از دوستان شما خرید کرد! مبلغ ${reward} تومان به کیف پول شما اضافه شد.`,
           });
        }
      }

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
      await db.update(subscriptions).set({ status: 'cancelled', updatedAt: new Date() }).where(eq(subscriptions.id, subId));
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
