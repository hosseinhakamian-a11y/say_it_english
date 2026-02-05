import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.url?.includes('ping')) {
        return res.json({ status: "alive", env: !!process.env.DATABASE_URL });
    }

    try {
        const serverless = (await import("serverless-http")).default;
        const express = (await import("express")).default;
        
        // Try multiple possible paths for routes
        let registerRoutes;
        try {
            registerRoutes = (await import("../server/routes.js")).registerRoutes;
        } catch (e) {
            registerRoutes = (await import("./server/routes.js")).registerRoutes;
        }

        const app = express();
        app.use(express.json());
        await registerRoutes(null as any, app);
        
        return await serverless(app)(req, res);
    } catch (err: any) {
        return res.status(500).json({
            error: "Vercel Execution Failed",
            message: err.message,
            path: req.url,
            stack: err.stack
        });
    }
}
