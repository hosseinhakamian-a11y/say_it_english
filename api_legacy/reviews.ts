import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

// Helper to get user from session
async function getSessionUser(req: VercelRequest, pool: Pool) {
    const cookies = req.headers.cookie || '';
    const sessionCookie = cookies.split(';').find((c: string) => c.trim().startsWith('session='));
    const sessionToken = sessionCookie?.split('=')[1]?.trim() || '';
    
    if (!sessionToken) return null;
    
    const result = await pool.query('SELECT * FROM users WHERE session_token = $1', [sessionToken]);
    return result.rows[0] || null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const url = new URL(req.url || '', `https://${req.headers.host}`);
        const contentId = url.searchParams.get('contentId');

        // GET: دریافت نظرات یک دوره
        if (req.method === 'GET') {
            if (!contentId) {
                await pool.end();
                return res.status(400).json({ error: 'contentId الزامی است' });
            }

            // دریافت نظرات با اطلاعات کاربر
            const result = await pool.query(`
                SELECT 
                    r.id,
                    r.user_id,
                    r.content_id,
                    r.rating,
                    r.comment,
                    r.created_at,
                    u.username,
                    u.first_name,
                    u.last_name,
                    u.avatar
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                WHERE r.content_id = $1 AND r.is_approved = true
                ORDER BY r.created_at DESC
            `, [contentId]);

            // محاسبه میانگین امتیاز
            const statsResult = await pool.query(`
                SELECT 
                    COUNT(*) as total_reviews,
                    AVG(rating)::numeric(2,1) as average_rating
                FROM reviews 
                WHERE content_id = $1 AND is_approved = true
            `, [contentId]);

            await pool.end();

            return res.status(200).json({
                reviews: result.rows.map(row => ({
                    id: row.id,
                    userId: row.user_id,
                    contentId: row.content_id,
                    rating: row.rating,
                    comment: row.comment,
                    createdAt: row.created_at,
                    user: {
                        username: row.username,
                        firstName: row.first_name,
                        lastName: row.last_name,
                        avatar: row.avatar
                    }
                })),
                stats: {
                    totalReviews: parseInt(statsResult.rows[0]?.total_reviews || '0'),
                    averageRating: parseFloat(statsResult.rows[0]?.average_rating || '0')
                }
            });
        }

        // POST: ثبت نظر جدید
        if (req.method === 'POST') {
            const user = await getSessionUser(req, pool);
            if (!user) {
                await pool.end();
                return res.status(401).json({ error: 'لطفاً وارد شوید' });
            }

            const { contentId: postContentId, rating, comment } = req.body;

            // Validation
            if (!postContentId || !rating) {
                await pool.end();
                return res.status(400).json({ error: 'دوره و امتیاز الزامی است' });
            }

            if (rating < 1 || rating > 5) {
                await pool.end();
                return res.status(400).json({ error: 'امتیاز باید بین ۱ تا ۵ باشد' });
            }

            // بررسی وجود نظر قبلی از این کاربر
            const existing = await pool.query(
                'SELECT id FROM reviews WHERE user_id = $1 AND content_id = $2',
                [user.id, postContentId]
            );

            if (existing.rows.length > 0) {
                // آپدیت نظر قبلی
                await pool.query(
                    'UPDATE reviews SET rating = $1, comment = $2, created_at = NOW() WHERE user_id = $3 AND content_id = $4',
                    [rating, comment || null, user.id, postContentId]
                );
                await pool.end();
                return res.status(200).json({ message: 'نظر شما بروزرسانی شد', updated: true });
            }

            // ثبت نظر جدید
            const result = await pool.query(
                `INSERT INTO reviews (user_id, content_id, rating, comment)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [user.id, postContentId, rating, comment || null]
            );

            await pool.end();
            return res.status(201).json({ 
                message: 'نظر شما ثبت شد! ممنون از شما 🙏',
                review: result.rows[0]
            });
        }

        // DELETE: حذف نظر (فقط ادمین یا صاحب نظر)
        if (req.method === 'DELETE') {
            const user = await getSessionUser(req, pool);
            if (!user) {
                await pool.end();
                return res.status(401).json({ error: 'لطفاً وارد شوید' });
            }

            const { reviewId } = req.body;
            if (!reviewId) {
                await pool.end();
                return res.status(400).json({ error: 'reviewId الزامی است' });
            }

            // بررسی مالکیت یا ادمین بودن
            const review = await pool.query('SELECT user_id FROM reviews WHERE id = $1', [reviewId]);
            if (review.rows.length === 0) {
                await pool.end();
                return res.status(404).json({ error: 'نظر یافت نشد' });
            }

            if (review.rows[0].user_id !== user.id && user.role !== 'admin') {
                await pool.end();
                return res.status(403).json({ error: 'شما اجازه حذف این نظر را ندارید' });
            }

            await pool.query('DELETE FROM reviews WHERE id = $1', [reviewId]);
            await pool.end();
            return res.status(200).json({ message: 'نظر حذف شد' });
        }

        await pool.end();
        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error: any) {
        console.error('Reviews API Error:', error);
        await pool.end();
        return res.status(500).json({ error: 'خطای سرور', details: error.message });
    }
}
