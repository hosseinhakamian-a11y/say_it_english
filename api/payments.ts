import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.SESSION_SECRET || 'sayitenglish-secret-2025';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    const db = drizzle(pool);

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            await pool.end();
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string };

        if (req.method === 'GET') {
            // Admin: get all payments
            if (decoded.role !== 'admin') {
                await pool.end();
                return res.status(403).json({ error: 'Access denied' });
            }
            const allPayments = await db.select().from(payments);
            await pool.end();
            return res.status(200).json(allPayments);
        }

        if (req.method === 'POST') {
            // User: create payment
            const { contentId, amount, trackingCode } = req.body;
            const [payment] = await db.insert(payments).values({
                userId: decoded.id,
                contentId,
                amount,
                trackingCode,
            }).returning();
            await pool.end();
            return res.status(200).json(payment);
        }

        if (req.method === 'PATCH') {
            // Admin: update payment status
            if (decoded.role !== 'admin') {
                await pool.end();
                return res.status(403).json({ error: 'Access denied' });
            }
            const { id, status, notes } = req.body;
            const [updated] = await db.update(payments)
                .set({ status, notes })
                .where(eq(payments.id, id))
                .returning();

            // If approved, create purchase
            if (status === 'approved' && updated) {
                await db.insert(purchases).values({
                    userId: updated.userId,
                    contentId: updated.contentId,
                    paymentId: updated.id,
                });
            }

            await pool.end();
            return res.status(200).json(updated);
        }

        await pool.end();
        res.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
        await pool.end();
        console.error('Payments error:', error);
        res.status(500).json({ error: 'Error', details: error.message });
    }
}
