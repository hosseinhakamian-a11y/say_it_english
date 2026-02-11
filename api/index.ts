import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// ============ DATABASE POOL ============
let pool: Pool | null = null;
function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL not configured");
    pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  }
  return pool!;
}

// ============ AUTH HELPERS ============
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// ============ SMS HELPER ============
async function sendSMS(phone: string, message: string) {
  try {
    const apiKey = process.env.SMS_API_KEY;
    if (!apiKey) return;
    await fetch("https://api.sms.ir/v1/send/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
      body: JSON.stringify({
        mobile: phone,
        templateId: parseInt(process.env.SMS_TEMPLATE_ID || "100000"),
        parameters: [{ name: "MESSAGE", value: message }]
      })
    });
  } catch (e) { console.error("SMS Error:", e); }
}

// ============ CONTENT MAPPER ============
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
    arvanVideoId: row.arvan_video_id,
    arvanVideoProvider: row.arvan_video_provider,
    fileKey: row.file_key,
    isPremium: row.is_premium,
    price: row.price,
    thumbnailUrl: row.thumbnail_url,
    body: row.body,
    slug: row.slug,
    author: row.author,
    tags: row.tags,
    metadata: row.metadata || {},
    createdAt: row.created_at,
  };
}

// ============ MAIN HANDLER ============
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = getPool();
  const url = new URL(req.url || '', `https://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method;

  try {
    // ---- AUTH CHECK ----
    const cookies = req.headers.cookie || '';
    const sessionToken = cookies.split(';').find((c: string) => c.trim().startsWith('session='))?.split('=')[1]?.trim();
    
    let currentUser: any = null;
    if (sessionToken) {
      const userRes = await db.query('SELECT * FROM users WHERE session_token = $1', [sessionToken]);
      if (userRes.rows.length > 0) currentUser = userRes.rows[0];
    }

    // ================== AUTH ROUTES ==================
    if (pathname === '/api/login' && method === 'POST') {
      const { username, password, rememberMe } = req.body;
      const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
      const user = result.rows[0];
      if (!user || !(await comparePasswords(password, user.password))) {
        return res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است' });
      }
      const newToken = randomBytes(32).toString('hex');
      await db.query('UPDATE users SET session_token = $1 WHERE id = $2', [newToken, user.id]);
      const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
      res.setHeader('Set-Cookie', `session=${newToken}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}; Path=/`);
      return res.status(200).json({ id: user.id, username: user.username, role: user.role, avatar: user.avatar, firstName: user.first_name, lastName: user.last_name });
    }

    if (pathname === '/api/logout' && method === 'POST') {
      if (currentUser) {
        await db.query('UPDATE users SET session_token = NULL WHERE id = $1', [currentUser.id]);
      }
      res.setHeader('Set-Cookie', 'session=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/');
      return res.status(200).json({ message: 'Logged out' });
    }

    if (pathname === '/api/register' && method === 'POST') {
      const { username, password, phone } = req.body;
      const existing = await db.query('SELECT id FROM users WHERE username = $1', [username]);
      if (existing.rows.length > 0) return res.status(400).json({ error: 'نام کاربری تکراری است' });
      const hashedPassword = await hashPassword(password);
      const newToken = randomBytes(32).toString('hex');
      const newUserRes = await db.query(
        `INSERT INTO users (username, password, phone, role, session_token) VALUES ($1, $2, $3, 'user', $4) RETURNING id, username, role`,
        [username, hashedPassword, phone || null, newToken]
      );
      res.setHeader('Set-Cookie', `session=${newToken}; HttpOnly; Secure; SameSite=Lax; Max-Age=${604800}; Path=/`);
      return res.status(201).json(newUserRes.rows[0]);
    }

    if (pathname === '/api/user' && method === 'GET') {
      if (!currentUser) return res.status(401).json(null);
      return res.status(200).json({
        id: currentUser.id, username: currentUser.username, role: currentUser.role,
        firstName: currentUser.first_name, lastName: currentUser.last_name,
        phone: currentUser.phone, avatar: currentUser.avatar,
        level: currentUser.level || null,
        bio: currentUser.bio || null,
        birthDate: currentUser.birth_date || null,
        placementResult: currentUser.placement_result || null,
      });
    }

    // ================== CONTENT ROUTES ==================
    if (pathname === '/api/content' && method === 'GET') {
      const result = await db.query('SELECT * FROM content ORDER BY id DESC');
      return res.status(200).json(result.rows.map(mapContentRow));
    }

    if (pathname.match(/^\/api\/content\/\d+$/) && method === 'GET') {
      const id = pathname.split('/').pop();
      const result = await db.query('SELECT * FROM content WHERE id = $1', [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: "Content not found" });
      return res.status(200).json(mapContentRow(result.rows[0]));
    }

    if (pathname.match(/^\/api\/content\/\d+$/) && method === 'PATCH') {
      if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Admin only" });
      const id = pathname.split('/').pop();
      const { title, description, type, level, videoId, videoProvider, arvanVideoId, arvanVideoProvider, fileKey, isPremium, price, thumbnailUrl, metadata } = req.body;
      
      // Build dynamic update query
      const keys = [];
      const values = [];
      let idx = 1;
      
      if (title !== undefined) { keys.push(`title=$${idx++}`); values.push(title); }
      if (description !== undefined) { keys.push(`description=$${idx++}`); values.push(description); }
      if (type !== undefined) { keys.push(`type=$${idx++}`); values.push(type); }
      if (level !== undefined) { keys.push(`level=$${idx++}`); values.push(level); }
      if (videoId !== undefined) { keys.push(`video_id=$${idx++}`); values.push(videoId); }
      if (videoProvider !== undefined) { keys.push(`video_provider=$${idx++}`); values.push(videoProvider); }
      if (arvanVideoId !== undefined) { keys.push(`arvan_video_id=$${idx++}`); values.push(arvanVideoId); }
      if (arvanVideoProvider !== undefined) { keys.push(`arvan_video_provider=$${idx++}`); values.push(arvanVideoProvider); }
      if (fileKey !== undefined) { keys.push(`file_key=$${idx++}`); values.push(fileKey); }
      if (isPremium !== undefined) { keys.push(`is_premium=$${idx++}`); values.push(isPremium); }
      if (price !== undefined) { keys.push(`price=$${idx++}`); values.push(price); }
      if (thumbnailUrl !== undefined) { keys.push(`thumbnail_url=$${idx++}`); values.push(thumbnailUrl); }
      if (metadata !== undefined) { keys.push(`metadata=$${idx++}`); values.push(metadata); }
      
      if (keys.length === 0) return res.status(400).json({ error: "No fields to update" });
      
      values.push(id);
      const result = await db.query(`UPDATE content SET ${keys.join(", ")} WHERE id = $${idx} RETURNING *`, values);
      
      if (result.rows.length === 0) return res.status(404).json({ error: "Content not found" });
      return res.status(200).json(mapContentRow(result.rows[0]));
    }

    if (pathname === '/api/content' && method === 'POST') {
      if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Admin only" });
      const { title, description, type, level, videoId, videoProvider, arvanVideoId, arvanVideoProvider, fileKey, isPremium, price, thumbnailUrl, metadata } = req.body;
      const result = await db.query(`
        INSERT INTO content (title, description, type, level, video_id, video_provider, arvan_video_id, arvan_video_provider, file_key, is_premium, price, thumbnail_url, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *
      `, [title, description, type || 'video', level || 'beginner', videoId, videoProvider || 'bunny', arvanVideoId, arvanVideoProvider, fileKey, !!isPremium, parseInt(price) || 0, thumbnailUrl, metadata || {}]);
      return res.status(201).json(mapContentRow(result.rows[0]));
    }

    if (pathname.match(/\/api\/content\/\d+/) && method === 'DELETE') {
      if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Admin only" });
      const id = pathname.split('/').pop();
      await db.query('DELETE FROM content WHERE id = $1', [id]);
      return res.status(200).json({ success: true });
    }

    // ================== UPLOAD LINK ==================
    if (pathname.includes('/upload-link')) {
      const fileName = url.searchParams.get('fileName');
      const contentType = url.searchParams.get('contentType');
      if (fileName && contentType) {
        const fileKey = `uploads/${Date.now()}-${fileName}`;
        const client = new S3Client({
          region: "default", endpoint: process.env.ARVAN_ENDPOINT!,
          credentials: { accessKeyId: process.env.ARVAN_ACCESS_KEY!, secretAccessKey: process.env.ARVAN_SECRET_KEY! },
          forcePathStyle: true,
        });
        const command = new PutObjectCommand({ Bucket: process.env.ARVAN_BUCKET_NAME!, Key: fileKey, ContentType: contentType });
        const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
        return res.status(200).json({ uploadUrl, fileKey });
      }
    }

    // ================== REVIEWS ROUTES ==================
    if (pathname === '/api/reviews') {
      if (method === 'GET') {
        const contentId = url.searchParams.get('contentId');
        if (!contentId) return res.status(400).json({ error: 'contentId required' });
        const reviews = await db.query(`
          SELECT r.*, u.username, u.first_name, u.last_name, u.avatar 
          FROM reviews r JOIN users u ON r.user_id = u.id 
          WHERE r.content_id = $1 AND r.is_approved = true ORDER BY r.created_at DESC
        `, [contentId]);
        const stats = await db.query(`SELECT COUNT(*) as total, AVG(rating) as avg FROM reviews WHERE content_id = $1 AND is_approved = true`, [contentId]);
        return res.status(200).json({
          reviews: reviews.rows.map(row => ({
            id: row.id, userId: row.user_id, contentId: row.content_id, rating: row.rating, comment: row.comment, createdAt: row.created_at,
            user: { username: row.username, firstName: row.first_name, lastName: row.last_name, avatar: row.avatar }
          })),
          stats: { totalReviews: parseInt(stats.rows[0]?.total || '0'), averageRating: parseFloat(stats.rows[0]?.avg || '0') }
        });
      }
      
      if (method === 'POST') {
        if (!currentUser) return res.status(401).json({ error: 'Login required' });
        const { contentId, rating, comment } = req.body;
        const exist = await db.query('SELECT id FROM reviews WHERE user_id = $1 AND content_id = $2', [currentUser.id, contentId]);
        if (exist.rows.length > 0) {
          await db.query('UPDATE reviews SET rating = $1, comment = $2, created_at = NOW() WHERE user_id = $3 AND content_id = $4', [rating, comment, currentUser.id, contentId]);
        } else {
          await db.query('INSERT INTO reviews (user_id, content_id, rating, comment) VALUES ($1, $2, $3, $4)', [currentUser.id, contentId, rating, comment]);
        }
        return res.status(200).json({ message: 'Review saved' });
      }

      if (method === 'DELETE') {
        if (!currentUser) return res.status(401).json({ error: 'Login required' });
        const { reviewId } = req.body;
        const review = await db.query('SELECT * FROM reviews WHERE id = $1', [reviewId]);
        if (review.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        if (review.rows[0].user_id !== currentUser.id && currentUser.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        await db.query('DELETE FROM reviews WHERE id = $1', [reviewId]);
        return res.status(200).json({ message: 'Deleted' });
      }
    }

    // ================== SLOTS ROUTES ==================
    if (pathname === '/api/slots') {
      if (method === 'GET') {
        const result = await db.query('SELECT * FROM time_slots WHERE is_booked = false AND date >= NOW() ORDER BY date');
        return res.status(200).json(result.rows);
      }
      if (method === 'POST') {
        if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Admin only" });
        const { date, duration } = req.body;
        const result = await db.query('INSERT INTO time_slots (date, duration) VALUES ($1, $2) RETURNING *', [new Date(date), duration || 30]);
        return res.status(201).json(result.rows[0]);
      }
      if (method === 'DELETE') {
        if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Admin only" });
        const { id } = req.query;
        await db.query('DELETE FROM time_slots WHERE id = $1', [id]);
        return res.status(200).json({ success: true });
      }
    }

    // ================== BOOKINGS ROUTES ==================
    if (pathname === '/api/bookings' && method === 'POST') {
      const { timeSlotId, phone, notes, type = 'private_class' } = req.body;
      const slot = await db.query('SELECT * FROM time_slots WHERE id = $1', [timeSlotId]);
      if (slot.rows.length === 0 || slot.rows[0].is_booked) return res.status(400).json({ error: 'Slot not available' });

      const booking = await db.query(
        `INSERT INTO bookings (user_id, time_slot_id, type, date, phone, notes, status) VALUES ($1, $2, $3, $4, $5, $6, 'confirmed') RETURNING *`,
        [currentUser ? currentUser.id : 0, timeSlotId, type, slot.rows[0].date, phone, notes]
      );
      await db.query('UPDATE time_slots SET is_booked = true WHERE id = $1', [timeSlotId]);
      
      // Send SMS
      const dateStr = new Date(slot.rows[0].date).toLocaleDateString('fa-IR');
      await sendSMS("09123104254", `رزرو جدید: ${dateStr}`);
      
      return res.status(201).json(booking.rows[0]);
    }

    // ================== PAYMENTS & PURCHASES ==================
    // Handle dynamic route for Payment Status Update: /api/payments/:id/status
    const paymentStatusMatch = pathname.match(/^\/api\/payments\/(\d+)\/status$/);
    if (paymentStatusMatch && method === 'PATCH') {
         if (!currentUser || currentUser.role !== 'admin') {
             return res.status(403).json({ error: "Admin only" });
         }
         const paymentId = paymentStatusMatch[1];
         const { status } = req.body;
         
         const updated = await db.query(
             'UPDATE payments SET status = $1 WHERE id = $2 RETURNING *', 
             [status, paymentId]
         );
         
         if (status === 'approved' && updated.rows.length > 0) {
           const payment = updated.rows[0];
           // Add to purchases if not already there
            if (payment.content_id) {
                await db.query(
                    'INSERT INTO purchases (user_id, content_id, payment_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', 
                    [payment.user_id, payment.content_id, payment.id]
                );
            }
         }
         return res.status(200).json(updated.rows[0]);
    }

    if (pathname === '/api/payments') {
      if (!currentUser) return res.status(401).json({ error: 'Login required' });
      
      if (method === 'GET') {
        // Admin gets all, user gets own
        if (currentUser.role === 'admin') {
          const result = await db.query(`
            SELECT id, user_id as "userId", content_id as "contentId", amount, 
                   tracking_code as "trackingCode", status, notes, created_at as "createdAt"
            FROM payments ORDER BY created_at DESC
          `);
          return res.status(200).json(result.rows);
        }
      }

        if (method === 'POST') {
        const { contentId, planId, amount, trackingCode, method: paymentMethod } = req.body;
        const result = await db.query(
          `INSERT INTO payments (user_id, content_id, amount, tracking_code, payment_method, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [currentUser.id, contentId || null, amount, trackingCode, paymentMethod || 'card', planId ? `Plan: ${planId}` : null]
        );
        return res.status(201).json(result.rows[0]);
      }

      if (method === 'PATCH') {
         // Fallback for non-dynamic path if needed, but the dynamic one above should handle standard requests
         // This block handles general updates if useful
        if (currentUser.role !== 'admin') return res.status(403).json({ error: "Admin only" });
        const { id, status, notes } = req.body;
        const updated = await db.query('UPDATE payments SET status = $1, notes = $2 WHERE id = $3 RETURNING *', [status, notes, id]);
        
        return res.status(200).json(updated.rows[0]);
      }
    }
    
    // Purchases check (Returns full content details for the dashboard)
    if (pathname === '/api/purchases') {
      if (!currentUser) return res.status(200).json([]);
      const result = await db.query(`
        SELECT 
          c.id, c.title, c.type, c.level, c.thumbnail_url as "thumbnailUrl",
          p.created_at as "purchasedAt"
        FROM purchases p
        JOIN content c ON p.content_id = c.id
        WHERE p.user_id = $1
        UNION
        SELECT 
          c.id, c.title, c.type, c.level, c.thumbnail_url as "thumbnailUrl",
          pay.created_at as "purchasedAt"
        FROM payments pay
        JOIN content c ON pay.content_id = c.id
        WHERE pay.user_id = $1 AND pay.status = 'approved'
        ORDER BY "purchasedAt" DESC
      `, [currentUser.id]);
      return res.status(200).json(result.rows);
    }

    // ================== ADMIN STATS ==================
    if (pathname === '/api/admin/stats') {
      if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Admin only" });
      const stats = await Promise.all([
        db.query('SELECT COUNT(*) FROM users'),
        db.query('SELECT COUNT(*) FROM content'),
        db.query('SELECT COUNT(*) FROM bookings')
      ]);
      return res.status(200).json({ users: stats[0].rows[0].count, content: stats[1].rows[0].count, bookings: stats[2].rows[0].count });
    }

    // ================== PAYMENT SETTINGS ==================
    if (pathname === '/api/payment-settings') {
      if (method === 'GET') {
        try {
          const result = await db.query("SELECT value FROM settings WHERE key = 'payment_settings'");
          if (result.rows.length === 0) {
            return res.status(200).json({ bankCards: [], cryptoWallets: [] });
          }
          return res.status(200).json(result.rows[0].value);
        } catch (e) {
          // Table might not exist, return default
          return res.status(200).json({ bankCards: [], cryptoWallets: [] });
        }
      }
      
      if (method === 'PUT') {
        if (!currentUser || currentUser.role !== 'admin') {
          return res.status(403).json({ error: "Admin only" });
        }
        const { bankCards, cryptoWallets } = req.body;
        const value = JSON.stringify({ bankCards: bankCards || [], cryptoWallets: cryptoWallets || [] });
        
        // Upsert settings
        await db.query(`
          INSERT INTO settings (key, value) VALUES ('payment_settings', $1::jsonb)
          ON CONFLICT (key) DO UPDATE SET value = $1::jsonb, updated_at = NOW()
        `, [value]);
        
        return res.status(200).json({ success: true });
      }
    }
    // ================== USER PROFILE ==================
    if (pathname === '/api/profile' && method === 'PATCH') {
      if (!currentUser) return res.status(401).json({ error: "Not authenticated" });
      const { firstName, lastName, birthDate, bio, level } = req.body;
      
      const keys = [];
      const values = [];
      let idx = 1;
      
      if (firstName !== undefined) { keys.push(`first_name=$${idx++}`); values.push(firstName); }
      if (lastName !== undefined) { keys.push(`last_name=$${idx++}`); values.push(lastName); }
      if (birthDate !== undefined) { keys.push(`birth_date=$${idx++}`); values.push(birthDate || null); }
      if (bio !== undefined) { keys.push(`bio=$${idx++}`); values.push(bio); }
      if (level !== undefined) { keys.push(`level=$${idx++}`); values.push(level); }
      
      if (keys.length === 0) return res.status(400).json({ error: "No fields to update" });
      
      values.push(currentUser.id);
      await db.query(`UPDATE users SET ${keys.join(', ')} WHERE id = $${idx}`, values);
      
      return res.status(200).json({ success: true });
    }

    // ================== PLACEMENT TEST RESULT ==================
    if (pathname === '/api/placement-result' && method === 'POST') {
      if (!currentUser) return res.status(401).json({ error: "Not authenticated" });
      const { level, scores, avgScore, completedAt } = req.body;
      
      // Save level and placement result to user profile
      const placementResult = JSON.stringify({ scores, avgScore, completedAt });
      await db.query(
        `UPDATE users SET level = $1, placement_result = $2 WHERE id = $3`,
        [level, placementResult, currentUser.id]
      );
      
      return res.status(200).json({ success: true, level });
    }

    // ================== PROFILE PASSWORD ==================
    if (pathname === '/api/profile/password' && method === 'POST') {
      if (!currentUser) return res.status(401).json({ error: "Not authenticated" });
      const { currentPassword, newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: "رمز عبور باید حداقل ۶ کاراکتر باشد" });
      }
      
      // If user has existing password, verify it
      if (currentUser.password && currentPassword) {
        const valid = await comparePasswords(currentPassword, currentUser.password);
        if (!valid) return res.status(400).json({ error: "رمز عبور فعلی اشتباه است" });
      }
      
      const hashedPassword = await hashPassword(newPassword);
      await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, currentUser.id]);
      
      return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: "Not Found", path: pathname });
  } catch (error: any) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal Error", message: error.message });
  }
}
