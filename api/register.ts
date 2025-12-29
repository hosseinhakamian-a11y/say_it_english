import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import jwt from 'jsonwebtoken';

const scryptAsync = promisify(scrypt);
const JWT_SECRET = process.env.SESSION_SECRET || 'sayitenglish-secret-2025';

const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    role: text("role").default("user"),
    createdAt: timestamp("created_at").defaultNow(),
});

async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        const db = drizzle(pool);

        const { username, password } = req.body;

        if (!username || !password) {
            await pool.end();
            return res.status(400).json({ error: 'نام کاربری و رمز عبور الزامی است' });
        }

        const [existing] = await db.select().from(users).where(eq(users.username, username));
        if (existing) {
            await pool.end();
            return res.status(400).json({ error: 'کاربر با این نام وجود دارد' });
        }

        const hashedPassword = await hashPassword(password);
        const [newUser] = await db.insert(users).values({
            username,
            password: hashedPassword
        }).returning();

        await pool.end();

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser.id, username: newUser.username, role: newUser.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            id: newUser.id,
            username: newUser.username,
            role: newUser.role,
            token
        });
    } catch (error: any) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'خطا در ثبت نام', details: error.message });
    }
}
