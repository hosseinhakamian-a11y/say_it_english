import serverless from "serverless-http";
import express from "express";
import { registerRoutes } from "./routes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register API routes
registerRoutes(null as any, app);

export const handler = serverless(app);
