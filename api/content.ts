import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ============ DATABASE POOL ============
let pool: any = null;
function getPool() {
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
    }
    return pool;
}

// ============ HELPER: Map snake_case to camelCase ============
function mapContentRow(row: any) {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        type: row.type,
        level: row.level,
        contentUrl: row.content_url,
        videoId: row.video_id,
        videoProvider: row.video_provider,
        fileKey: row.file_key,
        isPremium: row.is_premium,
        price: row.price,
        thumbnailUrl: row.thumbnail_url,
        createdAt: row.created_at,
    };
}

// ============ MAIN HANDLER ============
export default async function handler(req: VercelRequest, res: VercelResponse) {
    const method = req.method || 'GET';
    const url = new URL(req.url || '', `https://${req.headers.host}`);

    // CORS
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (method === 'OPTIONS') return res.status(200).end();

    const db = getPool();

    // ============ AUTH CHECK ============
    const cookies = req.headers.cookie || '';
    const sessionToken = cookies.split(';').find(c => c.trim().startsWith('session='))?.split('=')[1];
    let currentUser: any = null;
    if (sessionToken) {
        const userRes = await db.query('SELECT * FROM users WHERE session_token = $1', [sessionToken]);
        if (userRes.rows.length > 0) currentUser = userRes.rows[0];
    }

    try {
        // ============ ROUTE: Upload Link (ArvanCloud) ============
        if (url.pathname.includes('/upload-link')) {
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
        }

        // ============ ROUTE: GET - List All Content ============
        if (method === 'GET') {
            const result = await db.query('SELECT * FROM content ORDER BY id DESC');
            const mappedContent = result.rows.map(mapContentRow);
            return res.status(200).json(mappedContent);
        }

        // ============ ROUTE: POST - Create Content (Admin Only) ============
        if (method === 'POST') {
            if (!currentUser || currentUser.role !== 'admin') {
                return res.status(403).json({ error: "Unauthorized. Admin role required." });
            }

            const { title, description, type, level, videoId, videoProvider, fileKey, isPremium, price } = req.body;

            const query = `
                INSERT INTO content (title, description, type, level, video_id, video_provider, file_key, is_premium, price)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `;
            const values = [
                title || 'Untitled',
                description || '',
                type || 'video',
                level || 'beginner',
                videoId || '',
                videoProvider || 'custom',
                fileKey || '',
                !!isPremium,
                parseInt(price) || 0
            ];

            const result = await db.query(query, values);
            return res.status(201).json(mapContentRow(result.rows[0]));
        }

        // ============ ROUTE: DELETE - Delete Content (Admin Only) ============
        if (method === 'DELETE') {
            if (!currentUser || currentUser.role !== 'admin') {
                return res.status(403).json({ error: "Unauthorized. Admin role required." });
            }
            const id = url.pathname.split('/').pop();
            await db.query('DELETE FROM content WHERE id = $1', [id]);
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: "Method Not Allowed" });

    } catch (error: any) {
        console.error('Content API Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
