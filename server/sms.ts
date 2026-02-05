import axios from "axios";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

export async function sendOTP(mobile: string, code: string) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error("CRITICAL ERROR: SUPABASE_URL or SUPABASE_ANON_KEY is not defined in environment variables!");
        throw new Error("Server configuration error: Missing Supabase credentials");
    }

    try {
        console.log(`Calling Supabase Edge Function at: ${SUPABASE_URL}/functions/v1/send-otp`);
        const response = await axios.post(
            `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/send-otp`,
            {
                phone: mobile,
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

        return response.data;
    } catch (error: any) {
        console.error("Supabase Edge Function Error:", error.response?.data || error.message);
        throw new Error("Failed to send SMS via Edge Function");
    }
}
