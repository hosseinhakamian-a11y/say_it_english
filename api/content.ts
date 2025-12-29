import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, serial, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        const db = drizzle(pool);

        const allContent = await db.select().from(content);
        await pool.end();

        res.status(200).json(allContent);
    } catch (error: any) {
        console.error('Content error:', error);
        res.status(500).json({ error: 'Error fetching content', details: error.message });
    }
}
