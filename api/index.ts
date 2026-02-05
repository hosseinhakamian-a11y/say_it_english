import serverless from "serverless-http";
import express from "express";
import { registerRoutes } from "../server/routes";
import session from "express-session";
import passport from "passport";
import { storage } from "../server/storage";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register all routes
const routesPromise = registerRoutes(null as any, app);

export default async (req: any, res: any) => {
  try {
    await routesPromise;
    return await serverless(app)(req, res);
  } catch (err: any) {
    console.error("Vercel Bridge Error:", err);
    res.status(500).json({ 
      message: "Internal Bridge Error", 
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
  }
};
