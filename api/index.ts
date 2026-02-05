import serverless from "serverless-http";
import express from "express";
import { registerRoutes } from "../server/routes";

const app = express();
app.use(express.json());

// Diagnostic log for Vercel
console.log("Vercel Bridge initializing...");
console.log("Environment check:", {
  hasDbUrl: !!process.env.DATABASE_URL,
  hasSmsKey: !!process.env.SMS_IR_API_KEY,
  nodeEnv: process.env.NODE_ENV
});

let routesPromise: Promise<any> | null = null;

export default async (req: any, res: any) => {
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
