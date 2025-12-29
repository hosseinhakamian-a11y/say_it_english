import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.SESSION_SECRET || 'sayitenglish-secret-2025';

const posts = pgTable("posts", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    content: text("content").notNull(),
    excerpt: text("excerpt"),
    coverImage: text("cover_image"),
    authorId: text("author_id"),
    status: text("status").default("draft"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    const db = drizzle(pool);

    try {
        if (req.method === 'GET') {
            // Public: get all published posts
            const allPosts = await db.select().from(posts);
            await pool.end();
            return res.status(200).json(allPosts);
        }

        // Protected routes
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            await pool.end();
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string };

        if (decoded.role !== 'admin') {
            await pool.end();
            return res.status(403).json({ error: 'Access denied' });
        }

        if (req.method === 'POST') {
            const { title, slug, content, excerpt, coverImage, status } = req.body;
            const [post] = await db.insert(posts).values({
                title,
                slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
                content,
                excerpt,
                coverImage,
                authorId: String(decoded.id),
                status: status || 'published',
            }).returning();
            await pool.end();
            return res.status(200).json(post);
        }

        await pool.end();
        res.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
        await pool.end();
        console.error('Posts error:', error);
        res.status(500).json({ error: 'Error', details: error.message });
    }
}
