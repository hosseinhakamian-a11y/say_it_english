import axios from "axios";

// SMS.ir and Supabase integration
// Note: Environment variables are read inside the function for Vercel serverless compatibility

export async function sendOTP(mobile: string, code: string) {
    // Read environment variables at runtime (not at module load time)
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    const SMS_IR_API_KEY = process.env.SMS_IR_API_KEY;
    const SMS_IR_TEMPLATE_ID = process.env.SMS_IR_TEMPLATE_ID;

    console.log("[SMS] Environment check:", {
        hasSmsKey: !!SMS_IR_API_KEY,
        hasTemplateId: !!SMS_IR_TEMPLATE_ID,
        hasSupabaseUrl: !!SUPABASE_URL,
        hasSupabaseKey: !!SUPABASE_ANON_KEY
    });

    // Standardize phone number for SMS.ir (e.g., 0912...)
    let cleanPhone = mobile.replace(/\D/g, ""); // فقط اعداد
    if (cleanPhone.startsWith("98")) cleanPhone = cleanPhone.substring(2);
    if (!cleanPhone.startsWith("0")) cleanPhone = "0" + cleanPhone;

    // First attempt: Direct call to SMS.ir
    try {
        console.log(`[SMS] Attempting direct call to SMS.ir for ${cleanPhone}...`);
        const directResponse = await axios.post(
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
                timeout: 5000 // 5 seconds timeout for direct call
            }
        );

        if (directResponse.data.status === 1) {
            console.log("[SMS] Direct call successful!");
            return { success: true, method: "direct", data: directResponse.data };
        }
        throw new Error(`SMS.ir returned status ${directResponse.data.status}: ${directResponse.data.message}`);
    } catch (directError: any) {
        console.warn(`[SMS] Direct call failed, falling back to Supabase. Error: ${directError.message}`);

        // Second attempt: Fallback to Supabase Edge Function
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.error("[SMS] Cannot fallback to Supabase: Missing SUPABASE_URL or SUPABASE_ANON_KEY");
            throw new Error(`SMS.ir failed and Supabase fallback not configured: ${directError.message}`);
        }
        
        try {
            console.log(`[SMS] Attempting fallback via Supabase Edge Function...`);
            const supabaseResponse = await axios.post(
                `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/send-otp`,
                {
                    phone: cleanPhone,
                    code: code,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${SUPABASE_ANON_KEY.trim()}`,
                        "apikey": SUPABASE_ANON_KEY.trim(),
                    },
                }
            );

            console.log("[SMS] Supabase fallback successful!");
            return { success: true, method: "supabase", data: supabaseResponse.data };
        } catch (supabaseError: any) {
            const detail = supabaseError.response?.data || supabaseError.message;
            console.error("[SMS] Both methods failed. Supabase Error:", detail);
            throw new Error(`SMS Error (Both methods failed): ${typeof detail === 'object' ? JSON.stringify(detail) : detail}`);
        }
    }
}
