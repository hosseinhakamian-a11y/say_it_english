import serverless from "serverless-http";
import express from "express";
import { registerRoutes } from "../server/routes";
import session from "express-session";
import passport from "passport";
import { storage } from "../server/storage";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register all routes (this will call setupAuth which configures sessions/passport)
registerRoutes(null as any, app);

export default serverless(app);
