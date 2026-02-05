import serverless from "serverless-http";
import express from "express";
import { registerRoutes } from "../server/routes";

const app = express();
app.use(express.json());

// Diagnostic log for Vercel
console.log("Vercel Bridge initializing...");

const REQUIRED_VARS = ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SMS_IR_API_KEY'];

let routesPromise: Promise<any> | null = null;

export default async (req: any, res: any) => {
  const missing = REQUIRED_VARS.filter(v => !process.env[v]);
  if (missing.length > 0) {
    return res.status(500).json({
      error: "Configuration Missing",
      message: `The following environment variables are missing in Vercel: ${missing.join(', ')}`,
      tip: "Go to Vercel Dashboard > Settings > Environment Variables and add them."
    });
  }
  try {
    if (!routesPromise) {
      console.log("Starting route registration...");
      routesPromise = registerRoutes(null as any, app);
    }
    await routesPromise;
    const handler = serverless(app);
    return await handler(req, res);
  } catch (err: any) {
    console.error("FATAL VERCEL ERROR:", err);
    res.status(500).json({ 
      error: "Vercel Bridge Crash", 
      message: err.message,
      check_logs: "Check Vercel Dashboard for full stack trace"
    });
  }
};
