import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        const result = await pool.query('SELECT NOW() as time');
        await pool.end();

        res.status(200).json({
            message: "دیتابیس متصل است!",
            dbTime: result.rows[0].time,
            serverTime: new Date().toISOString()
        });
    } catch (error: any) {
        res.status(500).json({
            error: "خطا در اتصال به دیتابیس",
            details: error.message
        });
    }
}
