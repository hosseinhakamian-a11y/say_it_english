import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';

// ============ DATABASE SETUP ============
const { Pool } = pg;
let db: any = null;
let pool: any = null;

function getDb() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL not configured");
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
    db = drizzle(pool);
  }
  return db;
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

  console.log("[SMS] Sending to:", cleanPhone, "Code:", code);

  try {
    console.log("[SMS] Attempting direct SMS.ir call...");
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
    console.error("[SMS] SMS.ir failed:", smsError.message);
    
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        const supabaseResponse = await axios.post(
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
      } catch (supabaseError: any) {
        throw new Error(`Both SMS methods failed`);
      }
    }
    throw smsError;
  }
}

// ============ OTP Storage (in-memory for now, will use DB later) ============
const otpStore: Map<string, { otp: string, expires: number }> = new Map();

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ---- Ping/Test ----
  if (url.includes('/api/ping')) {
    return res.status(200).json({
      status: "alive",
      version: "8.0.0-full",
      timestamp: new Date().toISOString(),
      env: {
        hasDb: !!process.env.DATABASE_URL,
        hasSmsKey: !!process.env.SMS_IR_API_KEY,
        hasTemplateId: !!process.env.SMS_IR_TEMPLATE_ID,
        hasSupabase: !!process.env.SUPABASE_URL
      }
    });
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
      
      // Store OTP with 5-minute expiry
      otpStore.set(normalized, { 
        otp, 
        expires: Date.now() + 5 * 60 * 1000 
      });

      console.log("[OTP] Generated for", normalized, ":", otp);

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
      const code = body?.code;

      if (!phone || !code) {
        return res.status(400).json({ error: "Phone and code are required" });
      }

      const normalized = cleanPhone(phone);
      const stored = otpStore.get(normalized);

      console.log("[OTP Verify] Phone:", normalized, "Code:", code, "Stored:", stored);

      if (!stored) {
        return res.status(400).json({ error: "OTP not found or expired. Please request a new one." });
      }

      if (Date.now() > stored.expires) {
        otpStore.delete(normalized);
        return res.status(400).json({ error: "OTP expired. Please request a new one." });
      }

      if (stored.otp !== code) {
        return res.status(400).json({ error: "Invalid OTP code" });
      }

      // OTP is valid - clear it
      otpStore.delete(normalized);

      // Try to get/create user from database
      try {
        const database = getDb();
        
        // Check if user exists
        const existingUsers = await pool.query(
          'SELECT * FROM users WHERE phone = $1',
          [normalized]
        );

        let user;
        if (existingUsers.rows.length > 0) {
          user = existingUsers.rows[0];
        } else {
          // Create new user
          const result = await pool.query(
            'INSERT INTO users (phone, role, created_at) VALUES ($1, $2, NOW()) RETURNING *',
            [normalized, 'user']
          );
          user = result.rows[0];
        }

        console.log("[OTP Verify] User:", user);

        return res.status(200).json({ 
          message: "OTP verified successfully",
          user: {
            id: user.id,
            phone: user.phone,
            role: user.role,
            name: user.name || null
          }
        });

      } catch (dbError: any) {
        console.error("[OTP Verify] DB Error:", dbError);
        // Return success even without DB (user will need to try again)
        return res.status(200).json({ 
          message: "OTP verified successfully",
          warning: "User profile could not be loaded"
        });
      }

    } catch (err: any) {
      console.error("[OTP Verify] Error:", err);
      return res.status(500).json({ error: "Verification failed", message: err.message });
    }
  }

  // ---- Get current user ----
  if (url.includes('/api/user') && method === 'GET') {
    // For now, return null (no session implemented yet)
    return res.status(200).json(null);
  }

  // ---- Default response ----
  return res.status(404).json({
    error: "Endpoint not found",
    requestedPath: url,
    availableEndpoints: [
      "GET /api/ping",
      "POST /api/auth/otp/request",
      "POST /api/auth/otp/verify",
      "GET /api/user"
    ]
  });
}
