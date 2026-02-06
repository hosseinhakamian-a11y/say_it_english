import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import pg from 'pg';

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
      } catch (supabaseError: any) {
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
      version: "9.0.0-db-otp",
      timestamp: new Date().toISOString()
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
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

      console.log("[OTP Request] Phone:", normalized, "OTP:", otp);

      const db = getPool();

      // Check if user exists
      const existingUsers = await db.query(
        'SELECT * FROM users WHERE phone = $1',
        [normalized]
      );

      if (existingUsers.rows.length > 0) {
        // Update existing user with new OTP
        await db.query(
          'UPDATE users SET otp = $1, otp_expires = $2 WHERE phone = $3',
          [otp, otpExpires, normalized]
        );
        console.log("[OTP Request] Updated OTP for existing user");
      } else {
        // Create new user with OTP
        await db.query(
          'INSERT INTO users (phone, otp, otp_expires, role, created_at) VALUES ($1, $2, $3, $4, NOW())',
          [normalized, otp, otpExpires, 'user']
        );
        console.log("[OTP Request] Created new user with OTP");
      }

      // Send SMS
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
      
      console.log("[OTP Verify] Raw body:", JSON.stringify(body));
      
      const phone = body?.phone;
      // Support both 'code' and 'otp' field names
      const code = body?.code || body?.otp;

      if (!phone || !code) {
        return res.status(400).json({ 
          error: "Phone and code are required",
          debug: { receivedBody: body }
        });
      }

      const normalized = cleanPhone(phone);
      console.log("[OTP Verify] Phone:", normalized, "Code:", code);

      const db = getPool();

      // Get user with OTP
      const result = await db.query(
        'SELECT * FROM users WHERE phone = $1',
        [normalized]
      );

      if (result.rows.length === 0) {
        console.log("[OTP Verify] User not found");
        return res.status(400).json({ error: "User not found. Please request OTP first." });
      }

      const user = result.rows[0];
      console.log("[OTP Verify] User found:", { 
        id: user.id, 
        storedOtp: user.otp, 
        expires: user.otp_expires,
        providedCode: code
      });

      if (!user.otp) {
        return res.status(400).json({ error: "No OTP found. Please request a new one." });
      }

      if (new Date() > new Date(user.otp_expires)) {
        return res.status(400).json({ error: "OTP expired. Please request a new one." });
      }

      if (user.otp !== code) {
        return res.status(400).json({ error: "Invalid OTP code" });
      }

      // OTP is valid - clear it
      await db.query(
        'UPDATE users SET otp = NULL, otp_expires = NULL WHERE phone = $1',
        [normalized]
      );

      console.log("[OTP Verify] Success for user:", user.id);

      return res.status(200).json({ 
        message: "OTP verified successfully",
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

  // ---- Get current user ----
  if (url.includes('/api/user') && method === 'GET') {
    return res.status(200).json(null);
  }

  // ---- Default response ----
  return res.status(404).json({
    error: "Endpoint not found",
    requestedPath: url
  });
}
