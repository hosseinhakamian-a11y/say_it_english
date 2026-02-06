import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import pg from 'pg';
import crypto from 'crypto';

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
      console.log("[/api/user] Cookie header:", cookieHeader);
      
      const cookies = parseCookies(cookieHeader);
      const sessionToken = cookies['session'];

      if (!sessionToken) {
        console.log("[/api/user] No 'session' cookie found");
        return res.status(401).json(null);
      }

      console.log("[/api/user] Found session token:", sessionToken.substring(0, 8) + '...');

      // Find user by session token
      const result = await db.query(
        'SELECT id, phone, name, role FROM users WHERE session_token = $1',
        [sessionToken]
      );

      if (result.rows.length === 0) {
        console.log("[/api/user] No user matches this token");
        return res.status(401).json(null);
      }

      console.log("[/api/user] Success! User ID:", result.rows[0].id);
      return res.status(200).json(result.rows[0]);
    } catch (err: any) {
      console.error("[/api/user] Critical Error:", err);
      return res.status(401).json(null);
    }
  }

  // ---- OTP Request ----
  if (url.includes('/api/auth/otp/request') && method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const phone = body?.phone;

      if (!phone) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      const normalized = cleanPhone(phone);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

      console.log("[OTP Request] Phone:", normalized, "OTP:", otp);

      const existingUsers = await db.query('SELECT * FROM users WHERE phone = $1', [normalized]);

      if (existingUsers.rows.length > 0) {
        await db.query('UPDATE users SET otp = $1, otp_expires = $2 WHERE phone = $3', [otp, otpExpires, normalized]);
      } else {
        await db.query(
          'INSERT INTO users (phone, otp, otp_expires, role, created_at) VALUES ($1, $2, $3, $4, NOW())',
          [normalized, otp, otpExpires, 'user']
        );
      }

      await sendSMS(phone, otp);
      return res.status(200).json({ message: "OTP sent successfully" });

    } catch (err: any) {
      console.error("[OTP Request] Error:", err);
      return res.status(500).json({ error: "Failed to send OTP", message: err.message });
    }
  }

  // ---- OTP Verify ----
  if (url.includes('/api/auth/otp/verify') && method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const phone = body?.phone;
      const code = body?.code || body?.otp;

      if (!phone || !code) {
        return res.status(400).json({ error: "Phone and code are required" });
      }

      const normalized = cleanPhone(phone);
      console.log("[OTP Verify] Phone:", normalized, "Code:", code);

      const result = await db.query('SELECT * FROM users WHERE phone = $1', [normalized]);

      if (result.rows.length === 0) {
        return res.status(400).json({ error: "User not found" });
      }

      const user = result.rows[0];

      if (!user.otp || new Date() > new Date(user.otp_expires)) {
        return res.status(400).json({ error: "OTP expired" });
      }

      if (user.otp !== code) {
        return res.status(400).json({ error: "Invalid OTP code" });
      }

      // Generate session token
      const sessionToken = generateToken();

      // Update user: clear OTP and set session token
      await db.query(
        'UPDATE users SET otp = NULL, otp_expires = NULL, session_token = $1 WHERE phone = $2',
        [sessionToken, normalized]
      );

      // Set session cookie with production-ready flags (Secure + Lax)
      const cookieFlags = [
        `session=${sessionToken}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        "Max-Age=604800", // 1 week
        "Secure" // Force Secure for Vercel HTTPS
      ].join("; ");

      res.setHeader('Set-Cookie', cookieFlags);

      console.log("[OTP Verify] Success, session cookie set.");

      return res.status(200).json({ 
        message: "Login successful",
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role,
          name: user.name || null
        }
      });

    } catch (err: any) {
      console.error("[OTP Verify] Error:", err);
      return res.status(500).json({ error: "Verification failed", message: err.message });
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
