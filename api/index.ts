import express from "express";
import serverless from "serverless-http";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let serverlessHandler: any = null;

export default async (req: any, res: any) => {
  try {
    if (!serverlessHandler) {
      console.log("Initializing serverless app...");
      const { registerRoutes } = await import("../server/routes.js");
      await registerRoutes(null as any, app);
      serverlessHandler = serverless(app);
    }
    
    // Quick handle for ping
    if (req.url.includes("/api/ping")) {
      return res.json({ status: "alive", message: "Server is ready" });
    }

    return await serverlessHandler(req, res);
  } catch (err: any) {
    console.error("VERCEL STARTUP ERROR:", err);
    res.status(500).json({
      error: "Startup Failed",
      message: err.message,
      stack: err.stack,
      hint: "Check if all local imports in the error stack have .js extensions"
    });
  }
};
