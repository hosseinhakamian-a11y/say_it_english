import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, serial, timestamp, integer, boolean, text } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';

const timeSlots = pgTable("time_slots", {
    id: serial("id").primaryKey(),
    date: timestamp("date").notNull(),
    duration: integer("duration").default(30),
    isBooked: boolean("is_booked").default(false),
    createdAt: timestamp("created_at").defaultNow(),
});

const bookings = pgTable("bookings", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    timeSlotId: integer("time_slot_id"),
    type: text("type").notNull(),
    date: timestamp("date").notNull(),
    status: text("status").default("pending"),
    notes: text("notes"),
    phone: text("phone"),
    createdAt: timestamp("created_at").defaultNow(),
});

// SMS sending function
async function sendSMS(phone: string, message: string) {
    try {
        const apiKey = process.env.SMS_API_KEY;
        if (!apiKey) {
            console.log("No SMS API key, skipping SMS");
            return;
        }

        // Using sms.ir API
        const response = await fetch("https://api.sms.ir/v1/send/verify", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": apiKey,
            },
            body: JSON.stringify({
                mobile: phone,
                templateId: parseInt(process.env.SMS_TEMPLATE_ID || "100000"),
                parameters: [
                    { name: "MESSAGE", value: message }
                ]
            })
        });

        console.log("SMS sent:", await response.json());
    } catch (error) {
        console.error("SMS error:", error);
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    const db = drizzle(pool);

    try {
        if (req.method === 'POST') {
            const { timeSlotId, phone, notes, type = 'private_class' } = req.body;

            if (!timeSlotId) {
                await pool.end();
                return res.status(400).json({ error: 'Time slot ID is required' });
            }

            // Get the time slot
            const [slot] = await db.select().from(timeSlots).where(eq(timeSlots.id, timeSlotId));

            if (!slot) {
                await pool.end();
                return res.status(404).json({ error: 'Time slot not found' });
            }

            if (slot.isBooked) {
                await pool.end();
                return res.status(400).json({ error: 'This time slot is already booked' });
            }

            // Create booking
            const [newBooking] = await db.insert(bookings).values({
                userId: 0, // Guest booking (no auth required for simplicity)
                timeSlotId,
                type,
                date: slot.date,
                phone,
                notes,
                status: 'confirmed'
            }).returning();

            // Mark slot as booked
            await db.update(timeSlots)
                .set({ isBooked: true })
                .where(eq(timeSlots.id, timeSlotId));

            // Send SMS to teacher
            const teacherPhone = "09123104254"; // Teacher's phone
            const dateStr = new Date(slot.date).toLocaleDateString('fa-IR');
            const timeStr = new Date(slot.date).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

            await sendSMS(teacherPhone, `رزرو جدید: ${dateStr} ساعت ${timeStr}`);

            await pool.end();
            return res.status(201).json(newBooking);
        }

        await pool.end();
        res.status(405).json({ error: 'Method not allowed' });

    } catch (error: any) {
        console.error('Booking API error:', error);
        await pool.end();
        res.status(500).json({ error: 'Server error', details: error.message });
    }
}
