import axios from "axios";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

export async function sendOTP(mobile: string, code: string) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error("CRITICAL ERROR: SUPABASE_URL or SUPABASE_ANON_KEY is not defined in environment variables!");
        throw new Error("Server configuration error: Missing Supabase credentials");
    }

    // Standardize phone number for SMS.ir (e.g., 0912...)
    let cleanPhone = mobile.replace(/\D/g, ""); // فقط اعداد
    if (cleanPhone.startsWith("98")) cleanPhone = cleanPhone.substring(2);
    if (!cleanPhone.startsWith("0")) cleanPhone = "0" + cleanPhone;

    try {
        console.log(`[SMS DEBUG] Request payload:`, { phone: cleanPhone, code });
        const response = await axios.post(
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

        console.log("[SMS DEBUG] Supabase Response Data:", response.data);
        return { 
            success: true, 
            data: response.data,
            debug: { url: SUPABASE_URL, phone: cleanPhone }
        };
    } catch (error: any) {
        const detail = error.response?.data || error.message;
        console.error("[SMS DEBUG] Error:", detail);
        throw new Error(`SMS Error: ${typeof detail === 'object' ? JSON.stringify(detail) : detail}`);
    }
}
