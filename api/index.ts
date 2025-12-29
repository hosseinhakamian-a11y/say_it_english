import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { pgTable, serial, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";

const scryptAsync = promisify(scrypt);

// Schema definitions inline
const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    email: text("email"),
    role: text("role").default("user"),
    createdAt: timestamp("created_at").defaultNow(),
});

const content = pgTable("content", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    type: text("type").notNull(),
    level: text("level").notNull(),
    contentUrl: text("content_url"),
    videoId: text("video_id"),
    videoProvider: text("video_provider"),
    isPremium: boolean("is_premium").default(false),
    price: integer("price").default(0),
    createdAt: timestamp("created_at").defaultNow(),
});

const payments = pgTable("payments", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    contentId: integer("content_id").notNull(),
    amount: integer("amount").notNull(),
    trackingCode: text("tracking_code").notNull(),
    status: text("status").default("pending"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
});

const purchases = pgTable("purchases", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    contentId: integer("content_id").notNull(),
    paymentId: integer("payment_id"),
    createdAt: timestamp("created_at").defaultNow(),
});

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});
const db = drizzle(pool);

// Crypto functions
async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || "sayitenglish-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, sameSite: "lax" },
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.username, username));
        if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false);
        }
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: number, done) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// Routes
app.post("/api/register", async (req, res) => {
    try {
        const { username, password } = req.body;
        const [existing] = await db.select().from(users).where(eq(users.username, username));
        if (existing) return res.status(400).send("کاربر با این نام وجود دارد");

        const hashedPassword = await hashPassword(password);
        const [user] = await db.insert(users).values({ username, password: hashedPassword }).returning();

        req.login(user, (err) => {
            if (err) return res.status(500).send("خطا در ورود");
            res.json(user);
        });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).send("خطا در ثبت نام");
    }
});

app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.json(req.user);
});

app.post("/api/logout", (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).send("Error");
        res.sendStatus(200);
    });
});

app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
});

app.get("/api/content", async (req, res) => {
    try {
        const allContent = await db.select().from(content);
        res.json(allContent);
    } catch (error) {
        console.error("Content error:", error);
        res.status(500).send("Error fetching content");
    }
});

app.post("/api/content", async (req, res) => {
    try {
        if (!req.isAuthenticated() || (req.user as any)?.role !== "admin") {
            return res.status(403).send("Unauthorized");
        }
        const [newContent] = await db.insert(content).values(req.body).returning();
        res.json(newContent);
    } catch (error) {
        console.error("Create content error:", error);
        res.status(500).send("Error");
    }
});

app.get("/api/users", async (req, res) => {
    try {
        if (!req.isAuthenticated() || (req.user as any)?.role !== "admin") {
            return res.status(403).send("Unauthorized");
        }
        const allUsers = await db.select().from(users);
        res.json(allUsers);
    } catch (error) {
        res.status(500).send("Error");
    }
});

app.post("/api/payments", async (req, res) => {
    try {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        const { contentId, amount, trackingCode } = req.body;
        const [payment] = await db.insert(payments).values({
            userId: (req.user as any).id,
            contentId,
            amount,
            trackingCode,
        }).returning();
        res.json(payment);
    } catch (error) {
        res.status(500).send("Error");
    }
});

app.get("/api/payments", async (req, res) => {
    try {
        if (!req.isAuthenticated() || (req.user as any)?.role !== "admin") {
            return res.status(403).send("Unauthorized");
        }
        const allPayments = await db.select().from(payments);
        res.json(allPayments);
    } catch (error) {
        res.status(500).send("Error");
    }
});

app.get("/api/purchases", async (req, res) => {
    try {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        const userPurchases = await db.select().from(purchases).where(eq(purchases.userId, (req.user as any).id));
        res.json(userPurchases);
    } catch (error) {
        res.status(500).send("Error");
    }
});

// Vercel handler
export default function handler(req: VercelRequest, res: VercelResponse) {
    return app(req as any, res as any);
}
