import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.SESSION_SECRET || 'sayitenglish-secret-2025';

const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    role: text("role").default("user"),
    createdAt: timestamp("created_at").defaultNow(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: string };

        // Check if user is admin
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        const db = drizzle(pool);

        const allUsers = await db.select({
            id: users.id,
            username: users.username,
            role: users.role,
            createdAt: users.createdAt,
        }).from(users);

        await pool.end();

        res.status(200).json(allUsers);
    } catch (error: any) {
        console.error('Users error:', error);
        res.status(500).json({ error: 'Error fetching users', details: error.message });
    }
}
