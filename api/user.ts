import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        // Get session token from cookie
        const cookies = req.headers.cookie || '';
        let sessionToken = '';
        const sessionCookie = cookies.split(';').find((c: string) => c.trim().startsWith('session='));
        if (sessionCookie) {
            sessionToken = sessionCookie.split('=')[1]?.trim() || '';
        }

        if (!sessionToken) {
            return res.status(200).json(null); // Not logged in
        }

        // Get user from database by session token
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        const result = await pool.query('SELECT * FROM users WHERE session_token = $1', [sessionToken]);
        await pool.end();

        if (result.rows.length === 0) {
            return res.status(200).json(null); // Session expired or invalid
        }

        const user = result.rows[0];

        return res.status(200).json({
            id: user.id,
            username: user.username,
            role: user.role,
            name: user.name,
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone,
            avatar: user.avatar,
            level: user.level,
            createdAt: user.created_at
        });
    } catch (error: any) {
        console.error('User fetch error:', error);
        return res.status(500).json({ error: 'خطا در دریافت اطلاعات کاربر' });
    }
}
