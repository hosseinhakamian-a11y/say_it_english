import serverless from "serverless-http";
import express from "express";
import { registerRoutes } from "../server/routes";

const REQUIRED_VARS = ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SMS_IR_API_KEY'];
const app = express();

app.use(express.json());

// Add a simple ping for status checking
app.get("/api/ping", (_req, res) => {
  res.json({ 
    status: "ok", 
    time: new Date().toISOString(),
    env_keys: REQUIRED_VARS.filter(v => !!process.env[v]),
    node_version: process.version
  });
});

let routesPromise: Promise<any> | null = null;

export default async (req: any, res: any) => {
  // Check config before anything else
  const missing = REQUIRED_VARS.filter(v => !process.env[v]);
  if (missing.length > 0) {
    return res.status(500).json({
      error: "Configuration Missing",
      message: `Required vars missing: ${missing.join(', ')}`
    });
  }

  try {
    if (!routesPromise) {
      routesPromise = registerRoutes(null as any, app);
    }
    await routesPromise;
    return await serverless(app)(req, res);
  } catch (err: any) {
    console.error("CRITICAL RUNTIME ERROR:", err);
    res.status(500).json({ 
      error: "Runtime Crash", 
      message: err.message,
      detail: "Check Vercel Logs for stack trace"
    });
  }
};
