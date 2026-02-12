
import { VercelRequest, VercelResponse } from '@vercel/node';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

// Static imports are now safe because storage-lite uses lazy DB connection
import { storage } from "../server/storage-lite";

const scryptAsync = promisify(scrypt);

// ============ SMS HELPER ============
function sendSMS(phone: string, message: string) {
  const apiKey = process.env.SMS_API_KEY;
  if (!apiKey) return;
  
  fetch("https://api.sms.ir/v1/send/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
    body: JSON.stringify({
      mobile: phone,
      templateId: parseInt(process.env.SMS_TEMPLATE_ID || "100000"),
      parameters: [{ name: "MESSAGE", value: message }]
    })
  }).catch(e => console.error("SMS Error (Background):", e));
}

// ============ PASSWORD UTILS ============
async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// ============ MAIN HANDLER ============
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS configuration
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const method = req.method;
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;
    const body = req.body || {};

    // ============ HEALTH CHECK ============
    if (pathname === '/api/health') {
      return res.status(200).json({ status: 'ok', hasDb: !!process.env.DATABASE_URL });
    }

    // ---- AUTH CHECK ----
    const cookies = req.headers.cookie || '';
    const sessionToken = cookies.split(';').find((c: string) => c.trim().startsWith('session='))?.split('=')[1]?.trim();
    let currentUser = null;
    if (sessionToken) {
      currentUser = await storage.getUserBySessionToken(sessionToken);
    }

    // ============ AUTH ENDPOINTS ============
    if (pathname === '/api/user' && method === 'GET') {
      if (!currentUser) return res.status(401).json(null);
      const { password: _, otp: __, otpExpires: ___, ...safeUser } = currentUser;
      return res.status(200).json(safeUser);
    }

    if (pathname === '/api/login' && method === 'POST') {
      const { username, password, rememberMe } = body;
      const user = await storage.getUserByUsername(username);

      if (!user || !user.password || !(await comparePasswords(password, user.password))) {
        return res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است' });
      }

      const newToken = randomBytes(32).toString('hex');
      await storage.updateUserSession(user.id, newToken);
      await storage.checkAndUpdateStreak(user.id).catch(() => {});

      const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
      res.setHeader('Set-Cookie', `session=${newToken}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}; Path=/`);

      const { password: _, ...safeUser } = user;
      return res.status(200).json(safeUser);
    }

    if (pathname === '/api/register' && method === 'POST') {
      const { username, password } = body;
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) return res.status(400).json({ error: 'نام کاربری قبلاً انتخاب شده است' });

      const salt = randomBytes(16).toString('hex');
      const hashed = (await scryptAsync(password, salt, 64)) as Buffer;
      const hashedPassword = `${hashed.toString('hex')}.${salt}`;

      const newToken = randomBytes(32).toString('hex');
      const insertUser = {
        ...body,
        password: hashedPassword,
        sessionToken: newToken,
        role: 'user',
        level: 'beginner'
      };
      
      const newUser = await storage.createUser(insertUser as any);
      await storage.checkAndUpdateStreak(newUser.id).catch(() => {});

      res.setHeader('Set-Cookie', `session=${newToken}; HttpOnly; Secure; SameSite=Lax; Max-Age=${604800}; Path=/`);
      const { password: _, ...safeUser } = newUser;
      return res.status(201).json(safeUser);
    }

    // ============ OTP ENDPOINTS ============
    if (pathname === '/api/auth/otp/request' && method === 'POST') {
      const { phone } = body;
      if (!phone) return res.status(400).json({ error: "شماره موبایل الزامی است" });

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

      let user = await storage.getUserByPhone(phone);
      const ADMIN_PHONES = ["09222453571", "09123104254"];
      const isAdmin = ADMIN_PHONES.includes(phone);

      if (!user) {
        user = await storage.createUser({
          username: `user_${phone}`,
          phone,
          role: isAdmin ? "admin" : "user",
          firstName: null,
          lastName: null,
          password: null,
          sessionToken: null
        } as any);
      }
      
      await storage.updateUser(user.id, { 
        otp, 
        otpExpires,
        role: isAdmin && user.role !== 'admin' ? 'admin' : user.role 
      });

      sendSMS(phone, otp);
      return res.status(200).json({ message: "OTP sent" });
    }

    if (pathname === '/api/auth/otp/verify' && method === 'POST') {
      const { phone, otp, rememberMe } = body;
      if (!phone || !otp) return res.status(400).json({ error: "اطلاعات ناقص است" });

      const user = await storage.getUserByPhone(phone);
      if (!user) return res.status(404).json({ error: "کاربر یافت نشد" });

      if (user.otp !== otp || !user.otpExpires || new Date(user.otpExpires) < new Date()) {
        return res.status(400).json({ error: "کد تایید نامعتبر یا منقضی شده است" });
      }

      await storage.updateUser(user.id, { otp: null, otpExpires: null });

      const newToken = randomBytes(32).toString('hex');
      await storage.updateUserSession(user.id, newToken);
      await storage.checkAndUpdateStreak(user.id).catch(() => {});

      const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
      res.setHeader('Set-Cookie', `session=${newToken}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}; Path=/`);
      
      const { password: _, otp: __, otpExpires: ___, ...safeUser } = user;
      return res.status(200).json(safeUser);
    }

    // ============ CONTENT ============
    if (pathname === '/api/content' && method === 'GET') {
      const items = await storage.getContent();
      return res.status(200).json(items);
    }

    // Fallback
    return res.status(404).json({ error: "Route not found", path: pathname });

  } catch (error: any) {
    console.error("API Error Details:", error);
    return res.status(500).json({ 
      error: "Internal Server Error", 
      message: error.message || "Unknown error"
    });
  }
}
