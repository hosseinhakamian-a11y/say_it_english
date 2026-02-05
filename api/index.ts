import express from "express";
import serverless from "serverless-http";
import { registerRoutes } from "../server/routes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Ping endpoint to verify Version 3
app.get("/api/ping", (_req, res) => {
  res.json({ 
    status: "alive", 
    version: "3.0.0",
    message: "Say It English Bridge is Operational"
  });
});

// Register all API routes
// We call this immediately. If it fails, Vercel will show logs during build.
const initRoutes = async () => {
    try {
        await registerRoutes(null as any, app);
    } catch (err) {
        console.error("Route Registration Failed:", err);
    }
};

initRoutes();

export default serverless(app);
