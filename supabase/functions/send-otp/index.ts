import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // مدیریت درخواست‌های CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, code } = await req.json()
    console.log(`Attempting to send OTP to ${phone}`)

    const apiKey = Deno.env.get('SMS_IR_API_KEY')
    const templateId = Deno.env.get('SMS_IR_TEMPLATE_ID')

    const response = await fetch("https://api.sms.ir/v1/send/verify", {
      method: "POST",
      headers: {
        "x-api-key": apiKey || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mobile: phone,
        templateId: parseInt(templateId || "0"),
        parameters: [{ name: "CODE", value: code }]
      })
    })

    const result = await response.json()
    console.log("SMS.ir full response:", JSON.stringify(result))

    // در sms.ir اگر وضعیت 1 نباشد یعنی خطایی رخ داده است
    const isSuccessful = result.status === 1;

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: isSuccessful ? 200 : 400,
    })

  } catch (error) {
    console.error("Edge Function Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})