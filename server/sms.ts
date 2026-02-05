import axios from "axios";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

export async function sendOTP(mobile: string, code: string) {
    try {
        console.log(`Calling Supabase Edge Function to send SMS to ${mobile}`);
        const response = await axios.post(
            `${SUPABASE_URL}/functions/v1/send-otp`,
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
