import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from "express";
import session from "express-session";
import { setupAuth } from "../server/auth";
import { registerRoutes } from "../server/routes";
import { storage } from "../server/storage";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || "sayitenglish-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
    },
}));

// Setup authentication
setupAuth(app);

// Register API routes
registerRoutes(null as any, app);

// Vercel serverless handler
export default function handler(req: VercelRequest, res: VercelResponse) {
    return app(req as any, res as any);
}
