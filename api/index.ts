import express from "express";
import serverless from "serverless-http";
import { registerRoutes } from "../server/routes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Ping endpoint to verify deployment
app.get("/api/ping", (_req, res) => {
  res.json({ 
    status: "alive", 
    version: "4.0.0",
    timestamp: new Date().toISOString(),
    env: {
      hasDb: !!process.env.DATABASE_URL,
      hasSmsKey: !!process.env.SMS_IR_API_KEY,
      hasTemplateId: !!process.env.SMS_IR_TEMPLATE_ID,
      hasSupabase: !!process.env.SUPABASE_URL
    }
  });
});

// Initialize routes once and cache the promise
let routesInitialized: Promise<any> | null = null;

const initRoutes = () => {
  if (!routesInitialized) {
    routesInitialized = registerRoutes(null as any, app).catch(err => {
      console.error("Route Registration Failed:", err);
      throw err;
    });
  }
  return routesInitialized;
};

// Serverless handler that ensures routes are ready
export default async (req: any, res: any) => {
  try {
    await initRoutes();
    const handler = serverless(app);
    return await handler(req, res);
  } catch (err: any) {
    console.error("Vercel Handler Error:", err);
    res.status(500).json({
      error: "Server Error",
      message: err.message
    });
  }
};
