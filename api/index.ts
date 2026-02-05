import serverless from "serverless-http";
import express from "express";
import { registerRoutes } from "../server/routes.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple Ping
app.get("/api/ping", (_req, res) => {
  res.json({ status: "alive", message: "Vercel Bridge is operational" });
});

// Initialization flag
let initialized = false;

export default async (req: any, res: any) => {
  try {
    if (!initialized) {
      await registerRoutes(null as any, app);
      initialized = true;
    }
    const handler = serverless(app);
    return await handler(req, res);
  } catch (err: any) {
    console.error("Vercel Bridge Failure:", err);
    res.status(500).json({
      error: "Bridge Failure",
      message: err.message,
      stack: err.stack
    });
  }
};
