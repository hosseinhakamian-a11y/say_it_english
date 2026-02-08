import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { scrypt, timingSafeEqual, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function comparePasswords(supplied: string, stored: string) {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
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
        const { username, password, rememberMe } = req.body;

        if (!username || !password) {
            await pool.end();
            return res.status(400).json({ error: 'نام کاربری و رمز عبور الزامی است' });
        }

        // Find user
        const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = userResult.rows[0];

        if (!user || !(await comparePasswords(password, user.password))) {
            await pool.end();
            return res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است' });
        }

        // Generate session token
        const sessionToken = randomBytes(32).toString('hex');

        // Save session token to database
        await pool.query('UPDATE users SET session_token = $1 WHERE id = $2', [sessionToken, user.id]);

        await pool.end();

        // Set cookie - 30 days if rememberMe, else 7 days
        const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
        res.setHeader('Set-Cookie', `session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}; Path=/`);

        return res.status(200).json({
            id: user.id,
            username: user.username,
            role: user.role,
            name: user.name,
            phone: user.phone,
        });
    } catch (error: any) {
        console.error('Login error:', error);
        await pool.end();
        return res.status(500).json({ error: 'خطا در ورود', details: error.message });
    }
}
