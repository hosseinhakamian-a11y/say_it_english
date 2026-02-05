import serverless from "serverless-http";
import express from "express";
import { registerRoutes } from "../server/routes.js"; // Note the .js extension for ESM compatibility

const app = express();
app.use(express.json());

// Simple ping
app.get("/api/ping", (_req, res) => {
  res.json({ status: "alive" });
});

// Register all routes
registerRoutes(null as any, app);

export default serverless(app);
