import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

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

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const { username, password, name, phone } = req.body;

        if (!username || !password) {
            await pool.end();
            return res.status(400).json({ error: 'نام کاربری و رمز عبور الزامی است' });
        }

        // Check if user exists
        const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
        if (existing.rows.length > 0) {
            await pool.end();
            return res.status(400).json({ error: 'کاربر با این نام وجود دارد' });
        }

        const hashedPassword = await hashPassword(password);
        const sessionToken = randomBytes(32).toString('hex');

        // Insert new user with session token
        const result = await pool.query(
            `INSERT INTO users (username, password, name, phone, role, session_token) 
             VALUES ($1, $2, $3, $4, 'user', $5) 
             RETURNING id, username, role, name, phone`,
            [username, hashedPassword, name || null, phone || null, sessionToken]
        );

        const newUser = result.rows[0];

        await pool.end();

        // Set session cookie (7 days)
        const maxAge = 7 * 24 * 60 * 60;
        res.setHeader('Set-Cookie', `session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}; Path=/`);

        return res.status(200).json({
            id: newUser.id,
            username: newUser.username,
            role: newUser.role,
            name: newUser.name,
            phone: newUser.phone,
        });
    } catch (error: any) {
        console.error('Register error:', error);
        await pool.end();
        return res.status(500).json({ error: 'خطا در ثبت نام', details: error.message });
    }
}
