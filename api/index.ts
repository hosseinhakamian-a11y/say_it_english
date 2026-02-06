import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

// ============ SMS SENDING LOGIC (inline) ============
async function sendSMS(phone: string, code: string) {
  const SMS_IR_API_KEY = process.env.SMS_IR_API_KEY;
  const SMS_IR_TEMPLATE_ID = process.env.SMS_IR_TEMPLATE_ID;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  // Clean phone number
  let cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.startsWith("98")) cleanPhone = cleanPhone.substring(2);
  if (!cleanPhone.startsWith("0")) cleanPhone = "0" + cleanPhone;

  console.log("[SMS] Sending to:", cleanPhone, "Code:", code);

  // Try SMS.ir first
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

    console.log("[SMS] SMS.ir response:", response.data);
    
    if (response.data.status === 1) {
      return { success: true, method: "sms.ir", data: response.data };
    }
    throw new Error(`SMS.ir status ${response.data.status}: ${response.data.message}`);
  } catch (smsError: any) {
    console.error("[SMS] SMS.ir failed:", smsError.message);
    
    // Fallback to Supabase Edge Function
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        console.log("[SMS] Trying Supabase Edge Function...");
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
        console.log("[SMS] Supabase response:", supabaseResponse.data);
        return { success: true, method: "supabase", data: supabaseResponse.data };
      } catch (supabaseError: any) {
        console.error("[SMS] Supabase failed:", supabaseError.message);
        throw new Error(`Both SMS methods failed. SMS.ir: ${smsError.message}, Supabase: ${supabaseError.message}`);
      }
    }
    throw smsError;
  }
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
  if (url.includes('/api/ping') || url.includes('/api/test')) {
    return res.status(200).json({
      status: "alive",
      version: "7.0.0-sms",
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

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      console.log("[OTP] Generated OTP for", phone, ":", otp);

      // Send SMS
      const result = await sendSMS(phone, otp);

      // TODO: Store OTP in database for verification
      // For now, we just send it (verification will need DB connection)

      return res.status(200).json({ 
        message: "OTP sent successfully",
        method: result.method,
        // Note: In production, remove the otp from response
        debug: { otp, phone: phone.slice(-4) }
      });

    } catch (err: any) {
      console.error("[OTP] Error:", err);
      return res.status(500).json({ 
        error: "Failed to send OTP",
        message: err.message 
      });
    }
  }

  // ---- Default response ----
  return res.status(200).json({
    message: "API endpoint not found",
    requestedPath: url,
    availableEndpoints: [
      "GET /api/ping",
      "POST /api/auth/otp/request"
    ]
  });
}
