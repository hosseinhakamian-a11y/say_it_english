import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, serial, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { eq, gte, and } from 'drizzle-orm';

const timeSlots = pgTable("time_slots", {
    id: serial("id").primaryKey(),
    date: timestamp("date").notNull(),
    duration: integer("duration").default(30),
    isBooked: boolean("is_booked").default(false),
    createdAt: timestamp("created_at").defaultNow(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    const db = drizzle(pool);

    try {
        if (req.method === 'GET') {
            // Get available (not booked) time slots from now onwards
            const now = new Date();
            const slots = await db.select().from(timeSlots)
                .where(and(
                    eq(timeSlots.isBooked, false),
                    gte(timeSlots.date, now)
                ))
                .orderBy(timeSlots.date);

            await pool.end();
            return res.status(200).json(slots);
        }

        if (req.method === 'POST') {
            // Admin only - add new time slot
            const { date, duration = 30 } = req.body;

            if (!date) {
                await pool.end();
                return res.status(400).json({ error: 'Date is required' });
            }

            const [newSlot] = await db.insert(timeSlots).values({
                date: new Date(date),
                duration
            }).returning();

            await pool.end();
            return res.status(201).json(newSlot);
        }

        if (req.method === 'DELETE') {
            // Admin only - delete a time slot
            const { id } = req.query;

            if (!id) {
                await pool.end();
                return res.status(400).json({ error: 'Slot ID is required' });
            }

            await db.delete(timeSlots).where(eq(timeSlots.id, parseInt(id as string)));

            await pool.end();
            return res.status(200).json({ success: true });
        }

        await pool.end();
        res.status(405).json({ error: 'Method not allowed' });

    } catch (error: any) {
        console.error('Slots API error:', error);
        await pool.end();
        res.status(500).json({ error: 'Server error', details: error.message });
    }
}
