import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, serial, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const contentTable = pgTable("content", {
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
    const url = new URL(req.url || '', `https://${req.headers.host}`);
    
    // 🛑 NEW: Handle Upload Link Request
    if (url.pathname.includes('/upload-link')) {
        try {
            const fileName = req.query.fileName as string;
            const contentType = req.query.contentType as string;

            if (!fileName || !contentType) {
                return res.status(400).json({ error: "fileName and contentType are required" });
            }

            const s3Client = new S3Client({
                region: "default",
                endpoint: process.env.ARVAN_ENDPOINT!,
                credentials: {
                    accessKeyId: process.env.ARVAN_ACCESS_KEY!,
                    secretAccessKey: process.env.ARVAN_SECRET_KEY!,
                },
                forcePathStyle: true,
            });

            const fileKey = `uploads/${Date.now()}-${fileName}`;
            const command = new PutObjectCommand({
                Bucket: process.env.ARVAN_BUCKET_NAME!,
                Key: fileKey,
                ContentType: contentType,
            });

            const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
            return res.status(200).json({ uploadUrl, fileKey });

        } catch (error: any) {
            console.error('Upload link error:', error);
            return res.status(500).json({ error: 'Internal Server Error', details: error.message });
        }
    }

    // Default: Fetch Content List
    try {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        const db = drizzle(pool);

        const allContent = await db.select().from(contentTable);
        await pool.end();

        res.status(200).json(allContent);
    } catch (error: any) {
        console.error('Content error:', error);
        res.status(500).json({ error: 'Error fetching content', details: error.message });
    }
}
