
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "../server/storage";
import { InsertUser } from "../shared/schema";

const scryptAsync = promisify(scrypt);

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

// ============ MAIN HANDLER ============
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url || '', `https://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method;

  try {
    // ---- AUTH CHECK ----
    const cookies = req.headers.cookie || '';
    const sessionToken = cookies.split(';').find((c: string) => c.trim().startsWith('session='))?.split('=')[1]?.trim();
    
    let currentUser = null;
    if (sessionToken) {
      currentUser = await storage.getUserBySessionToken(sessionToken);
    }

    // ================== AUTH ROUTES ==================
    if (pathname === '/api/login' && method === 'POST') {
      const { username, password, rememberMe } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || !user.password || !(await comparePasswords(password, user.password))) {
        return res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است' });
      }

      const newToken = randomBytes(32).toString('hex');
      await storage.updateUserSession(user.id, newToken);
      
      const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
      res.setHeader('Set-Cookie', `session=${newToken}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}; Path=/`);
      
      const { password: _, ...safeUser } = user;
      return res.status(200).json(safeUser);
    }

    if (pathname === '/api/logout' && method === 'POST') {
      if (currentUser) {
        await storage.updateUserSession(currentUser.id, null);
      }
      res.setHeader('Set-Cookie', 'session=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/');
      return res.status(200).json({ message: 'Logged out' });
    }

    if (pathname === '/api/register' && method === 'POST') {
      const { username, password, phone } = req.body;
      const existing = await storage.getUserByUsername(username);
      if (existing) return res.status(400).json({ error: 'نام کاربری تکراری است' });
      
      const hashedPassword = await hashPassword(password);
      const newToken = randomBytes(32).toString('hex');
      
      const insertUser: InsertUser = {
        username,
        password: hashedPassword,
        phone: phone || null,
        role: 'user',
        sessionToken: newToken
      };
      
      const newUser = await storage.createUser(insertUser);
      
      res.setHeader('Set-Cookie', `session=${newToken}; HttpOnly; Secure; SameSite=Lax; Max-Age=${604800}; Path=/`);
      const { password: _, ...safeUser } = newUser;
      return res.status(201).json(safeUser);
    }

    if (pathname === '/api/user' && method === 'GET') {
      if (!currentUser) return res.status(401).json(null);
      
      // Update streak
      const updatedUser = await storage.checkAndUpdateStreak(currentUser.id);
      const userToSend = updatedUser || currentUser;
      
      const { password: _, otp, otpExpires, ...safeUser } = userToSend;
      return res.status(200).json(safeUser);
    }

    // ================== CONTENT ROUTES ==================
    if (pathname === '/api/content' && method === 'GET') {
      const content = await storage.getContent();
      return res.status(200).json(content);
    }

    if (pathname.match(/^\/api\/content\/\d+$/) && method === 'GET') {
      const id = parseInt(pathname.split('/').pop() || '0');
      const item = await storage.getContentById(id);
      if (!item) return res.status(404).json({ error: "Content not found" });
      return res.status(200).json(item);
    }

    if (pathname.match(/^\/api\/content\/\d+$/) && method === 'PATCH') {
      if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Admin only" });
      const id = parseInt(pathname.split('/').pop() || '0');
      const updated = await storage.updateContent(id, req.body);
      if (!updated) return res.status(404).json({ error: "Content not found" });
      return res.status(200).json(updated);
    }

    if (pathname === '/api/content' && method === 'POST') {
      if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Admin only" });
      const content = await storage.createContent(req.body);
      return res.status(201).json(content);
    }

    if (pathname.match(/^\/api\/content\/\d+$/) && method === 'DELETE') {
      if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Admin only" });
      const id = parseInt(pathname.split('/').pop() || '0');
      await storage.deleteContent(id);
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
        const contentId = parseInt(url.searchParams.get('contentId') || '0');
        if (!contentId) return res.status(400).json({ error: 'contentId required' });
        const result = await storage.getReviews(contentId);
        return res.status(200).json(result);
      }
      
      if (method === 'POST') {
        if (!currentUser) return res.status(401).json({ error: 'Login required' });
        const { contentId, rating, comment } = req.body;
        
        // Check if exists logic could be implemented in storage, but for now insert/update check is handled by UI logic mostly or updateReview
        // A simple way is to try creating, usually one review per user per content
        // We added updateReview in storage, let's use a simple check or just insert
        // For simplicity and matching storage capabilities:
        try {
            await storage.createReview({ userId: currentUser.id, contentId, rating, comment });
            return res.status(200).json({ message: 'Review saved' });
        } catch (e) {
            // If duplicate (constraint violation), try update
             await storage.updateReview(currentUser.id, contentId, rating, comment);
             return res.status(200).json({ message: 'Review updated' });
        }
      }

      if (method === 'DELETE') {
        if (!currentUser) return res.status(401).json({ error: 'Login required' });
        const { reviewId } = req.body;
        const review = await storage.getReviewById(reviewId);
        
        if (!review) return res.status(404).json({ error: 'Not found' });
        if (review.userId !== currentUser.id && currentUser.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        
        await storage.deleteReview(reviewId);
        return res.status(200).json({ message: 'Deleted' });
      }
    }

    // ================== SLOTS ROUTES ==================
    if (pathname === '/api/slots') {
      if (method === 'GET') {
        const slots = await storage.getSlots();
        const availableSlots = slots.filter(s => !s.isBooked && new Date(s.date) >= new Date());
        return res.status(200).json(availableSlots);
      }
      if (method === 'POST') {
        if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Admin only" });
        const slot = await storage.createSlot(req.body);
        return res.status(201).json(slot);
      }
      if (method === 'DELETE') {
        if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Admin only" });
        const id = parseInt(req.query.id as string || '0');
        await storage.deleteSlot(id);
        return res.status(200).json({ success: true });
      }
    }

    // ================== BOOKINGS ROUTES ==================
    if (pathname === '/api/bookings' && method === 'POST') {
      const { timeSlotId, phone, notes, type = 'private_class' } = req.body;
      const slot = (await storage.getSlots()).find(s => s.id === timeSlotId);
      
      if (!slot || slot.isBooked) return res.status(400).json({ error: 'Slot not available' });

      // Mark slot as booked
      await storage.bookSlot(timeSlotId);
      
      const booking = await storage.createBooking({
        userId: currentUser ? currentUser.id : 0, 
        timeSlotId,
        type,
        date: new Date(slot.date), 
        phone,
        notes
      });
      
      // Send SMS
      const dateStr = new Date(slot.date).toLocaleDateString('fa-IR');
      await sendSMS("09123104254", `رزرو جدید: ${dateStr}`);
      
      return res.status(201).json(booking);
    }

    // ================== PAYMENTS & PURCHASES ==================
    // Handle dynamic route for Payment Status Update: /api/payments/:id/status
    const paymentStatusMatch = pathname.match(/^\/api\/payments\/(\d+)\/status$/);
    if (paymentStatusMatch && method === 'PATCH') {
         if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Admin only" });
         
         const paymentId = parseInt(paymentStatusMatch[1]);
         const { status } = req.body;
         
         const updated = await storage.updatePaymentStatus(paymentId, status);
         
         if (status === 'approved' && updated) {
            // Add to purchases if not already there
            if (updated.contentId) {
                try {
                  await storage.createPurchase({
                    userId: updated.userId,
                    contentId: updated.contentId,
                    paymentId: updated.id
                  });
                } catch (e) {
                   // Ignore if already purchased
                }
            }
         }
         return res.status(200).json(updated);
    }

    if (pathname === '/api/payments') {
      if (!currentUser) return res.status(401).json({ error: 'Login required' });
      
      if (method === 'GET') {
        if (currentUser.role === 'admin') {
          const payments = await storage.getPayments();
          return res.status(200).json(payments);
        }
      }

      if (method === 'POST') {
        const { contentId, planId, amount, trackingCode, method: paymentMethod } = req.body;
        const payment = await storage.createPayment({
          userId: currentUser.id,
          contentId: contentId || null,
          amount,
          trackingCode,
          paymentMethod: paymentMethod || 'card'
        });
        return res.status(201).json(payment);
      }
    }
    
    // Purchases check (Returns full content details for the dashboard)
    if (pathname === '/api/purchases') {
      if (!currentUser) return res.status(200).json([]);
      const purchases = await storage.getUserPurchases(currentUser.id);
      return res.status(200).json(purchases);
    }

    // ================== ADMIN STATS ==================
    if (pathname === '/api/admin/stats') {
      if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Admin only" });
      const users = await storage.getAllUsers();
      const content = await storage.getContent();
      // bookings count not directly exposed in simple storage interface, maybe add count later
      // simple approximation
      return res.status(200).json({ users: users.length, content: content.length, bookings: 0 }); 
    }

    // ================== PAYMENT SETTINGS ==================
    if (pathname === '/api/payment-settings') {
      if (method === 'GET') {
        const settings = await storage.getPaymentSettings();
        return res.status(200).json(settings);
      }
      
      if (method === 'PUT') {
        if (!currentUser || currentUser.role !== 'admin') return res.status(403).json({ error: "Admin only" });
        const settings = await storage.updatePaymentSettings(req.body);
        return res.status(200).json(settings);
      }
    }
    // ================== USER PROFILE ==================
    if (pathname === '/api/profile' && method === 'PATCH') {
      if (!currentUser) return res.status(401).json({ error: "Not authenticated" });
      await storage.updateUser(currentUser.id, req.body);
      return res.status(200).json({ success: true });
    }

    // ================== PLACEMENT TEST RESULT ==================
    if (pathname === '/api/placement-result' && method === 'POST') {
      if (!currentUser) return res.status(401).json({ error: "Not authenticated" });
      const { level, scores, avgScore, completedAt } = req.body;
      
      const placementResult = JSON.stringify({ scores, avgScore, completedAt });
      await storage.updateUser(currentUser.id, { level, placementResult } as any);
      
      return res.status(200).json({ success: true, level });
    }

    // ================== PROFILE PASSWORD ==================
    if (pathname === '/api/profile/password' && method === 'POST') {
      if (!currentUser) return res.status(401).json({ error: "Not authenticated" });
      const { currentPassword, newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: "رمز عبور باید حداقل ۶ کاراکتر باشد" });
      }
      
      if (currentUser.password && currentPassword) {
        const valid = await comparePasswords(currentPassword, currentUser.password);
        if (!valid) return res.status(400).json({ error: "رمز عبور فعلی اشتباه است" });
      }
      
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(currentUser.id, { password: hashedPassword });
      
      return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: "Not Found", path: pathname });
  } catch (error: any) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal Error", message: error.message });
  }
}
