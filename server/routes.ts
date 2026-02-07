import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { api } from "../shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // Admin phone numbers for auto-upgrade
  const ADMIN_PHONES = ["09222453571", "09123104254"];

  // One-time migration: Upgrade admin users by phone/username
  app.post("/api/admin/upgrade-admins", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const upgraded: string[] = [];
      
      for (const user of users) {
        const isAdminPhone = ADMIN_PHONES.includes(user.username) || 
                             (user.phone && ADMIN_PHONES.includes(user.phone));
        if (isAdminPhone && user.role !== "admin") {
          await storage.updateUser(user.id, { role: "admin" });
          upgraded.push(user.username);
        }
      }
      
      res.json({ 
        message: `Upgraded ${upgraded.length} users to admin`,
        upgraded 
      });
    } catch (error) {
      console.error("Admin upgrade error:", error);
      res.status(500).json({ error: "Failed to upgrade admins" });
    }
  });

  app.get(api.content.list.path, async (req, res) => {
    const content = await storage.getContent();
    res.json(content);
  });

  app.post(api.content.create.path, async (req, res) => {
    // @ts-ignore
    if (!req.isAuthenticated() || req.user?.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }
    const content = await storage.createContent(req.body);
    res.status(201).json(content);
  });

  app.patch("/api/content/:id", async (req, res) => {
    // @ts-ignore
    if (!req.isAuthenticated() || req.user?.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }
    const updated = await storage.updateContent(parseInt(req.params.id), req.body);
    if (!updated) return res.status(404).send("Content not found");
    res.json(updated);
  });

  app.delete("/api/content/:id", async (req, res) => {
    // @ts-ignore
    if (!req.isAuthenticated() || req.user?.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }
    await storage.deleteContent(parseInt(req.params.id));
    res.json({ success: true });
  });

  app.get(api.bookings.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // @ts-ignore
    const bookings = await storage.getBookings(req.user!.id);
    res.json(bookings);
  });

  app.post(api.bookings.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const booking = await storage.createBooking({
      ...req.body,
      // @ts-ignore
      userId: req.user!.id,
      date: new Date(req.body.date),
    });
    res.status(201).json(booking);
  });

  app.get(api.classes.list.path, async (req, res) => {
    const classes = await storage.getClasses();
    res.json(classes);
  });


  // Seeding logic moved to script/seed.ts

  // User Management (Admin Only)
  app.get(api.users.list.path, async (req, res) => {
    // @ts-ignore
    if (!req.isAuthenticated() || req.user?.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }
    const users = await storage.getAllUsers();
    // Exclude passwords from the response
    const safeUsers = users.map(({ password, ...rest }) => rest);
    res.json(safeUsers);
  });

  app.patch("/api/users/:id/role", async (req, res) => {
    // @ts-ignore
    if (!req.isAuthenticated() || req.user?.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }
    const { role } = req.body;
    const user = await storage.updateUserRole(parseInt(req.params.id), role);
    if (!user) return res.status(404).send("User not found");
    const { password, ...safeUser } = user;
    res.json(safeUser);
  });

  // ===== User Profile Endpoints =====
  
  // Update current user's profile
  app.patch("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // @ts-ignore
    const userId = req.user!.id;
    const { firstName, lastName, birthDate, bio, level } = req.body;
    
    const user = await storage.updateUser(userId, {
      firstName,
      lastName,
      birthDate,
      bio,
      level,
    });
    
    const { password, otp, otpExpires, ...safeUser } = user;
    res.json(safeUser);
  });

  // Change password (or set password for OTP users)
  app.post("/api/profile/password", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // @ts-ignore
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).send("Password must be at least 6 characters");
    }
    
    // @ts-ignore
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).send("User not found");
    
    // If user has existing password, verify current password
    if (user.password) {
      if (!currentPassword) {
        return res.status(400).send("Current password is required");
      }
      // Import comparePasswords from auth module
      const crypto = await import("crypto");
      const { promisify } = await import("util");
      const scryptAsync = promisify(crypto.scrypt);
      
      const [hashed, salt] = user.password.split(".");
      const hashedBuf = Buffer.from(hashed, "hex");
      const suppliedBuf = (await scryptAsync(currentPassword, salt, 64)) as Buffer;
      
      if (!crypto.timingSafeEqual(hashedBuf, suppliedBuf)) {
        return res.status(400).send("Current password is incorrect");
      }
    }
    
    // Hash new password
    const crypto = await import("crypto");
    const { promisify } = await import("util");
    const scryptAsync = promisify(crypto.scrypt);
    const newSalt = crypto.randomBytes(16).toString("hex");
    const buf = (await scryptAsync(newPassword, newSalt, 64)) as Buffer;
    const hashedPassword = `${buf.toString("hex")}.${newSalt}`;
    
    await storage.updateUser(userId, { password: hashedPassword });
    res.json({ message: "Password updated successfully" });
  });

  // Payment endpoints
  app.post("/api/payments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // @ts-ignore
    const payment = await storage.createPayment({ ...req.body, userId: req.user!.id });
    res.status(201).json(payment);
  });

  app.get("/api/payments", async (req, res) => {
    // @ts-ignore
    if (!req.isAuthenticated() || req.user?.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }
    const payments = await storage.getPayments();
    res.json(payments);
  });

  app.patch("/api/payments/:id/status", async (req, res) => {
    // @ts-ignore
    if (!req.isAuthenticated() || req.user?.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }
    const { status, notes } = req.body;
    const payment = await storage.updatePaymentStatus(parseInt(req.params.id), status, notes);
    if (!payment) return res.status(404).send("Payment not found");

    // If approved, automatically grant access to the user
    if (status === "approved") {
      await storage.createPurchase({
        userId: payment.userId,
        contentId: payment.contentId,
        paymentId: payment.id,
      });
    }

    res.json(payment);
  });

  // Get current user's purchases
  app.get("/api/purchases", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // @ts-ignore
    const purchases = await storage.getUserPurchases(req.user!.id);
    res.json(purchases);
  });

  // ===== Payment Settings (Admin Only) =====
  
  // Get payment settings (public - for payment page)
  app.get("/api/payment-settings", async (req, res) => {
    const settings = await storage.getPaymentSettings();
    res.json(settings);
  });

  // Update payment settings (admin only)
  app.put("/api/payment-settings", async (req, res) => {
    // @ts-ignore
    if (!req.isAuthenticated() || req.user?.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }
    const settings = await storage.updatePaymentSettings(req.body);
    res.json(settings);
  });

  return httpServer;
}
