import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { eq, or } from 'drizzle-orm';

// Admin phone numbers
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
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        const db = drizzle(pool);

        // Get all users
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

        res.status(200).json({
            message: `Upgraded ${upgraded.length} users to admin`,
            upgraded,
            adminPhones: ADMIN_PHONES,
            totalUsers: allUsers.length
        });
    } catch (error: any) {
        console.error('Upgrade admins error:', error);
        res.status(500).json({ error: 'Error upgrading admins', details: error.message });
    }
}
