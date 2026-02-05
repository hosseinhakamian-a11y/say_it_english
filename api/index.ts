import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. Simple response for PING
    if (req.url?.includes('ping')) {
        return res.status(200).json({ 
            status: "alive", 
            env: {
                hasDb: !!process.env.DATABASE_URL,
                hasSms: !!process.env.SMS_IR_API_KEY
            }
        });
    }

    try {
        // 2. Lazy load dependencies to catch errors
        const serverless = (await import("serverless-http")).default;
        const express = (await import("express")).default;
        const { registerRoutes } = await import("../server/routes");

        const app = express();
        app.use(express.json());
        await registerRoutes(null as any, app);
        
        const vercelHandler = serverless(app);
        return await vercelHandler(req, res);
    } catch (err: any) {
        return res.status(500).json({
            error: "Deferred Startup Failed",
            message: err.message,
            stack: err.stack
        });
    }
}
