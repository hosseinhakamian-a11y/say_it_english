import axios from "axios";

const SMS_IR_API_KEY = process.env.SMS_IR_API_KEY || "faDqItuwBouRfBb1uY80UOHfA3mMQG9MEyZKqfdjNefotGra";

const SMS_IR_TEMPLATE_ID = parseInt(process.env.SMS_IR_TEMPLATE_ID || "100000");

export async function sendOTP(mobile: string, code: string) {
    try {
        const response = await axios.post(
            "https://api.sms.ir/v1/send/verify",
            {
                mobile: mobile,
                templateId: SMS_IR_TEMPLATE_ID,
                parameters: [
                    {
                        name: "CODE",
                        value: code,
                    },
                ],
            },
            {
                headers: {
                    "x-api-key": SMS_IR_API_KEY,
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
            }
        );

        return response.data;
    } catch (error: any) {
        console.error("SMS.ir Error:", error.response?.data || error.message);
        throw new Error("Failed to send SMS");
    }
}
