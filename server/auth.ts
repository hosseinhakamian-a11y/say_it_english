import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, InsertUser } from "../shared/schema";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { sendOTP } from "./sms";

// Admin phone numbers - these users get admin role automatically
const ADMIN_PHONES = ["09222453571", "09123104254"];

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

import { Express, Request, Response, NextFunction } from "express";

export function setupAuth(app: Express) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !user.password || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback",
        },
        async (_accessToken: string, _refreshToken: string, profile: any, done: (err: any, user?: any) => void) => {
          try {
            let user = await storage.getUserByGoogleId(profile.id);
            if (!user) {
              const email = profile.emails?.[0]?.value || "";
              user = await storage.createUser({
                username: email || `google_${profile.id}`,
                googleId: profile.id,
                role: "student",
                level: "beginner",
              });
            }
            return done(null, user);
          } catch (err) {
            return done(err as Error);
          }
        }
      )
    );
  }

  passport.serializeUser((user, done) => done(null, (user as User).id));
  passport.deserializeUser(async (id, done) => {
    const user = await storage.getUser(id as number);
    done(null, user);
  });

  app.post("/api/register", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        req.session.save((err) => {
          if (err) return next(err);
          res.status(201).json(user);
        });
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", async (req, res, next) => {
    passport.authenticate("local", async (err: any, user: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).send("Invalid username or password");
      
      // Check if username OR phone is an admin phone number and update role if needed
      const isAdminPhone = ADMIN_PHONES.includes(user.username) || 
                          (user.phone && ADMIN_PHONES.includes(user.phone));
      if (isAdminPhone && user.role !== "admin") {
        await storage.updateUser(user.id, { role: "admin" });
        user.role = "admin";
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        req.session.save((err) => {
          if (err) return next(err);
          res.status(200).json(user);
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Google Auth Routes
  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
      res.redirect("/");
    }
  );

  // OTP Routes
  // ADMIN_PHONES is defined at the top of the file

  app.post("/api/auth/otp/request", async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).send("Phone number is required");

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    try {
      let user = await storage.getUserByPhone(phone);
      if (!user) {
        user = await storage.createUser({
          username: `user_${phone}`,
          phone,
          otp,
          otpExpires,
          role: ADMIN_PHONES.includes(phone) ? "admin" : "student",
        });
      } else {
        // If user exists, also update role if they are in the admin list
        if (ADMIN_PHONES.includes(phone) && user.role !== "admin") {
          await storage.updateUser(user.id, { role: "admin", otp, otpExpires });
        } else {
          await storage.updateUser(user.id, { otp, otpExpires });
        }
      }

      await sendOTP(phone, otp);
      res.json({ message: "OTP sent successfully" });
    } catch (err: any) {
      console.error("OTP Request Error:", err);
      res.status(500).send(err.message || "Failed to send OTP");
    }
  });

  app.post("/api/auth/otp/verify", async (req, res, next) => {
    const { phone, otp } = req.body;
    const user = await storage.getUserByPhone(phone);

    if (!user || user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).send("Invalid or expired OTP");
    }

    // Clear OTP after verification
    await storage.updateUser(user.id, { otp: null, otpExpires: null });

    req.login(user, (err) => {
      if (err) return next(err);
      req.session.save((err) => {
        if (err) return next(err);
        res.json(user);
      });
    });
  });

  // Set Password Route
  app.post("/api/user/password", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { password } = req.body;
    if (!password) return res.status(400).send("Password is required");

    const hashedPassword = await hashPassword(password);
    // @ts-ignore
    await storage.updateUser(req.user.id, { password: hashedPassword });
    res.json({ message: "Password updated successfully" });
  });
}
