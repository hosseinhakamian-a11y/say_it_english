import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    role: text("role").default("user"),
    createdAt: timestamp("created_at").defaultNow(),
});

async function comparePasswords(supplied: string, stored: string) {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
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

        const [user] = await db.select().from(users).where(eq(users.username, username));

        if (!user || !(await comparePasswords(password, user.password))) {
            await pool.end();
            return res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است' });
        }

        await pool.end();

        // Return user without password
        res.status(200).json({
            id: user.id,
            username: user.username,
            role: user.role,
            createdAt: user.createdAt
        });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'خطا در ورود', details: error.message });
    }
}
