import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import pg from 'pg';
import crypto, { scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// ============ DATABASE SETUP ============
const { Pool } = pg;
let pool: any = null;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL not configured");
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

// ============ PASSWORD HELPERS ============
async function comparePasswords(supplied: string, stored: string) {
  try {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) return false;
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (e) {
    return false;
  }
}

// ============ SESSION TOKEN HELPERS ============
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = value;
    }
  });
  return cookies;
}

// ============ SMS SENDING LOGIC ============
async function sendSMS(phone: string, code: string) {
  const SMS_IR_API_KEY = process.env.SMS_IR_API_KEY;
  const SMS_IR_TEMPLATE_ID = process.env.SMS_IR_TEMPLATE_ID;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  let cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.startsWith("98")) cleanPhone = cleanPhone.substring(2);
  if (!cleanPhone.startsWith("0")) cleanPhone = "0" + cleanPhone;

  try {
    const response = await axios.post(
      "https://api.sms.ir/v1/send/verify",
      {
        mobile: cleanPhone,
        templateId: parseInt(SMS_IR_TEMPLATE_ID || "0"),
        parameters: [{ name: "CODE", value: code }]
      },
      {
        headers: {
          "x-api-key": SMS_IR_API_KEY || "",
          "Content-Type": "application/json",
        },
        timeout: 10000
      }
    );

    if (response.data.status === 1) {
      return { success: true, method: "sms.ir" };
    }
    throw new Error(`SMS.ir status ${response.data.status}`);
  } catch (smsError: any) {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        await axios.post(
          `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/send-otp`,
          { phone: cleanPhone, code },
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
              "apikey": SUPABASE_ANON_KEY,
            },
            timeout: 10000
          }
        );
        return { success: true, method: "supabase" };
      } catch (e) {
        throw new Error(`Both SMS methods failed`);
      }
    }
    throw smsError;
  }
}

function cleanPhone(phone: string): string {
  let clean = phone.replace(/\D/g, "");
  if (clean.startsWith("98")) clean = clean.substring(2);
  if (!clean.startsWith("0")) clean = "0" + clean;
  return clean;
}

// ============ COOKIE HELPER ============
function setSessionCookie(res: VercelResponse, token: string) {
  const cookieOptions = [
    `session=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=604800", // 1 week
    "Secure" // Ensure this is set for Vercel
  ].join("; ");
  
  res.setHeader('Set-Cookie', cookieOptions);
}

// ============ MAIN HANDLER ============
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = req.url || '';
  const method = req.method || 'GET';

  // CORS headers
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  const db = getPool();

  // ---- Ping ----
  if (url.includes('/api/ping')) {
    return res.status(200).json({
      status: "alive",
      version: "10.0.0-session",
      timestamp: new Date().toISOString()
    });
  }

  // ---- Get Current User ----
  if (url.includes('/api/user') && method === 'GET') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    try {
      const cookieHeader = req.headers.cookie || '';
      const cookies = parseCookies(cookieHeader);
      const sessionToken = cookies['session'];

      if (!sessionToken) {
        return res.status(401).json(null);
      }

      const db = getPool();
      // Added password check
      const result = await db.query(
        'SELECT id, username, phone, name, role, level, (password IS NOT NULL) as "hasPassword" FROM users WHERE session_token = $1',
        [sessionToken]
      );

      if (result.rows.length === 0) {
        return res.status(401).json(null);
      }

      const user = result.rows[0];
      return res.status(200).json(user);
    } catch (err: any) {
      console.error("[/api/user] Error:", err);
      return res.status(401).json(null);
    }
  }

  // ---- Password Login ----
  if (url.includes('/api/login') && method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { username, password } = body;
      if (!username || !password) return res.status(400).json({ error: "Username and password required" });

      const result = await db.query('SELECT *, (password IS NOT NULL) as "hasPassword" FROM users WHERE username = $1 OR phone = $2', [username, username]);
      if (result.rows.length === 0) return res.status(401).json({ error: "User not found" });

      const user = result.rows[0];
      if (!user.password || !(await comparePasswords(password, user.password))) {
        return res.status(401).json({ error: "Invalid password" });
      }

      const sessionToken = generateToken();
      await db.query('UPDATE users SET session_token = $1 WHERE id = $2', [sessionToken, user.id]);

      setSessionCookie(res, sessionToken);
      return res.status(200).json({ id: user.id, username: user.username, hasPassword: true });
    } catch (err) {
      return res.status(500).json({ error: "Login failed" });
    }
  }

  // ---- OTP Request ----
  if (url.includes('/api/auth/otp/request') && method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const phone = body?.phone;

      if (!phone) return res.status(400).json({ error: "Phone number is required" });

      const normalized = cleanPhone(phone);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

      const ADMIN_PHONES = ['09222453571', '09123104254'];

      const db = getPool();
      const existingUsers = await db.query('SELECT * FROM users WHERE phone = $1', [normalized]);

      if (existingUsers.rows.length > 0) {
        await db.query('UPDATE users SET otp = $1, otp_expires = $2 WHERE phone = $3', [otp, otpExpires, normalized]);
      } else {
        const role = ADMIN_PHONES.includes(normalized) ? 'admin' : 'student';
        await db.query(
          'INSERT INTO users (username, phone, otp, otp_expires, role, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
          [`user_${normalized}`, normalized, otp, otpExpires, role]
        );
      }

      await sendSMS(phone, otp);
      return res.status(200).json({ message: "OTP sent successfully" });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to send OTP" });
    }
  }

  // ---- OTP Verify ----
  if (url.includes('/api/auth/otp/verify') && method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const phone = body?.phone;
      const code = body?.code || body?.otp;

      if (!phone || !code) return res.status(400).json({ error: "Phone and code are required" });

      const normalized = cleanPhone(phone);
      const db = getPool();
      const result = await db.query('SELECT *, (password IS NOT NULL) as "hasPassword" FROM users WHERE phone = $1', [normalized]);

      if (result.rows.length === 0) return res.status(400).json({ error: "User not found" });

      const user = result.rows[0];
      if (!user.otp || new Date() > new Date(user.otp_expires)) return res.status(400).json({ error: "OTP expired" });
      if (user.otp !== code) return res.status(400).json({ error: "Invalid OTP code" });

      const sessionToken = generateToken();
      
      const ADMIN_PHONES = ['09222453571', '09123104254'];
      let newRole = user.role;
      if (ADMIN_PHONES.includes(normalized) && user.role !== 'admin') {
        newRole = 'admin';
      }

      await db.query(
        'UPDATE users SET otp = NULL, otp_expires = NULL, session_token = $1, role = $2 WHERE phone = $3',
        [sessionToken, newRole, normalized]
      );

      setSessionCookie(res, sessionToken);

      return res.status(200).json({ 
        message: "Login successful",
        user: { 
          id: user.id, 
          username: user.username, 
          phone: user.phone, 
          role: newRole,
          hasPassword: user.hasPassword 
        }
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Verification failed" });
    }
  }

  // ---- Logout ----
  if (url.includes('/api/logout') && method === 'POST') {
    try {
      const cookies = parseCookies(req.headers.cookie);
      const sessionToken = cookies['session'];

      if (sessionToken) {
        await db.query('UPDATE users SET session_token = NULL WHERE session_token = $1', [sessionToken]);
      }

      res.setHeader('Set-Cookie', 'session=; Path=/; HttpOnly; Max-Age=0; Secure');
      return res.status(200).json({ message: "Logged out" });
    } catch (err: any) {
      return res.status(500).json({ error: "Logout failed" });
    }
  }

  // ---- Default ----
  return res.status(404).json({ error: "Endpoint not found", requestedPath: url });
}
