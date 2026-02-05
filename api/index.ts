import serverless from "serverless-http";
import express from "express";
import { registerRoutes } from "../server/routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Ping endpoint
app.get("/api/ping", (_req, res) => {
  res.json({ 
    status: "alive", 
    message: "Say It English API is running",
    timestamp: new Date().toISOString()
  });
});

// Register all API routes
// Note: We use top-level await if needed, but registerRoutes is usually sync or returns a promise
registerRoutes(null as any, app);

export default serverless(app);
