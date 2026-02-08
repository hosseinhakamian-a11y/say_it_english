import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.SESSION_SECRET || 'sayitenglish-secret-2025';

// Admin phone numbers for auto-upgrade
const ADMIN_PHONES = ["09222453571", "09123104254"];

const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    password: text("password"),
    phone: text("phone"),
    role: text("role").default("student"),
    createdAt: timestamp("created_at").defaultNow(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        const db = drizzle(pool);

        // Special action: Upgrade admins (no auth required)
        if (req.query.action === 'upgrade-admins') {
            const allUsers = await db.select().from(users);
            const upgraded: string[] = [];

            for (const user of allUsers) {
                const isAdminPhone = ADMIN_PHONES.includes(user.username) || 
                                     (user.phone && ADMIN_PHONES.includes(user.phone));
                
                if (isAdminPhone && user.role !== "admin") {
                    await db.update(users)
                        .set({ role: "admin" })
                        .where(eq(users.id, user.id));
                    upgraded.push(user.username);
                }
            }

            await pool.end();
            return res.status(200).json({
                message: `Upgraded ${upgraded.length} users to admin`,
                upgraded,
                adminPhones: ADMIN_PHONES,
                totalUsers: allUsers.length
            });
        }

        // Normal users list (requires admin auth)
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            await pool.end();
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: string };

        // Check if user is admin
        if (decoded.role !== 'admin') {
            await pool.end();
            return res.status(403).json({ error: 'Access denied' });
        }

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
