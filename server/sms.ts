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
        console.log(`Calling Supabase Edge Function for ${cleanPhone} at: ${SUPABASE_URL}/functions/v1/send-otp`);
        const response = await axios.post(
            `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/send-otp`,
            {
                phone: cleanPhone,
                code: code,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                    "apikey": SUPABASE_ANON_KEY,
                },
            }
        );

        console.log("Supabase Edge Function Raw Response:", response.data);
        return response.data;
    } catch (error: any) {
        const detail = error.response?.data?.message || JSON.stringify(error.response?.data) || error.message;
        console.error("Supabase Edge Function Error Details:", detail);
        throw new Error(`SMS Error: ${detail}`);
    }
}
