
import { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// ============ PASSWORD UTILS ============
async function comparePasswords(supplied: string, stored: string) {
  if (!supplied || !stored || !stored.includes('.')) return false;
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// ============ SMS HELPER ============
function sendSMS(phone: string, otp: string) {
  const apiKey = process.env.SMS_API_KEY;
  if (!apiKey) {
    console.warn("SMS_API_KEY missing, OTP would be:", otp);
    return;
  }
  
  fetch("https://api.sms.ir/v1/send/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
    body: JSON.stringify({
      mobile: phone,
      templateId: parseInt(process.env.SMS_TEMPLATE_ID || "100000"),
      parameters: [{ name: "MESSAGE", value: otp }]
    })
  }).catch(e => console.error("SMS Error:", e));
}

// ============ MAIN HANDLER ============
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Fix: Origin must be dynamic if credentials are used
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Lazy Load storage ONLY inside the handler to prevent early crashes
    const { storage } = await import("../server/storage-lite");
    
    const method = req.method;
    const url = new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;
    const body = req.body || {};

    // 1. Health Check (Independent of heavy logic)
    if (pathname === '/api/health') {
      return res.status(200).json({ status: 'ok', time: new Date().toISOString() });
    }

    // 2. Get Current User (Session check)
    const cookies = req.headers.cookie || '';
    const sessionToken = cookies.split(';').find((c) => c.trim().startsWith('session='))?.split('=')[1]?.trim();
    let currentUser = null;
    if (sessionToken) {
      currentUser = await storage.getUserBySessionToken(sessionToken);
    }

    // --- User Route ---
    if (pathname === '/api/user' && method === 'GET') {
      if (!currentUser) return res.status(401).json(null);
      const { password: _, otp: __, otpExpires: ___, ...safeUser } = currentUser;
      return res.status(200).json(safeUser);
    }

    // --- OTP Request ---
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
          firstName: '',
          lastName: '',
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
      return res.status(200).json({ message: "کد تایید ارسال شد" });
    }

    // --- OTP Verify ---
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

    // --- Login (Password) ---
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

    // --- Logout ---
    if (pathname === '/api/logout' && method === 'POST') {
      if (currentUser) await storage.updateUserSession(currentUser.id, null);
      res.setHeader('Set-Cookie', 'session=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/');
      return res.status(200).json({ success: true });
    }

    // --- Content ---
    if (pathname === '/api/content' && method === 'GET') {
      const items = await storage.getContent();
      return res.status(200).json(items);
    }

    return res.status(404).json({ error: 'Route not found' });

  } catch (err: any) {
    console.error("Critical Runtime Error:", err);
    return res.status(500).json({ 
      error: "خطای داخلی سرور", 
      message: err.message 
    });
  }
}
