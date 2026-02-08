import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get session token from cookie
        const cookies = req.headers.cookie || '';
        const sessionToken = cookies.split(';').find((c: string) => c.trim().startsWith('session='))?.split('=')[1];

        if (sessionToken) {
            // Clear session from database
            const pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: { rejectUnauthorized: false }
            });
            await pool.query('UPDATE users SET session_token = NULL WHERE session_token = $1', [sessionToken]);
            await pool.end();
        }

        // Clear cookie
        res.setHeader('Set-Cookie', 'session=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/');

        return res.status(200).json({ message: 'خروج موفق' });
    } catch (error: any) {
        console.error('Logout error:', error);
        return res.status(500).json({ error: 'خطا در خروج' });
    }
}
