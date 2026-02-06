import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from "express";
import serverless from "serverless-http";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple ping - no external dependencies
app.get("/api/ping", (_req, res) => {
  res.json({ 
    status: "alive", 
    version: "5.0.0",
    timestamp: new Date().toISOString(),
    env: {
      hasDb: !!process.env.DATABASE_URL,
      hasSmsKey: !!process.env.SMS_IR_API_KEY,
      hasTemplateId: !!process.env.SMS_IR_TEMPLATE_ID,
      hasSupabase: !!process.env.SUPABASE_URL
    }
  });
});

let routesRegistered = false;
let handler: any = null;

export default async function vercelHandler(req: VercelRequest, res: VercelResponse) {
  try {
    // Lazy load routes on first request
    if (!routesRegistered) {
      console.log("[Vercel] Registering routes...");
      const { registerRoutes } = await import("../server/routes");
      await registerRoutes(null as any, app);
      handler = serverless(app);
      routesRegistered = true;
      console.log("[Vercel] Routes registered successfully");
    }
    
    return await handler(req, res);
  } catch (err: any) {
    console.error("[Vercel] Handler Error:", err);
    return res.status(500).json({
      error: "Server Error",
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}
