import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { api } from "../shared/routes";
import { z } from "zod";
// Types are handled by types.d.ts globally

// Helper type for authenticated requests
interface AuthenticatedRequest extends Request {
  user?: Express.User;
}

// Helper function to check if user is admin
function isAdmin(req: AuthenticatedRequest): boolean {
  return req.isAuthenticated() && req.user?.role === "admin";
}

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

  // ===== Content Endpoints =====
  
  app.get(api.content.list.path, async (req, res) => {
    const content = await storage.getContent();
    res.json(content);
  });

  app.post(api.content.create.path, async (req: AuthenticatedRequest, res) => {
    if (!isAdmin(req)) {
      return res.status(403).send("Unauthorized");
    }
    const content = await storage.createContent(req.body);
    res.status(201).json(content);
  });

  app.patch("/api/content/:id", async (req: AuthenticatedRequest, res) => {
    if (!isAdmin(req)) {
      return res.status(403).send("Unauthorized");
    }
    const updated = await storage.updateContent(parseInt(req.params.id), req.body);
    if (!updated) return res.status(404).send("Content not found");
    res.json(updated);
  });

  app.delete("/api/content/:id", async (req: AuthenticatedRequest, res) => {
    if (!isAdmin(req)) {
      return res.status(403).send("Unauthorized");
    }
    await storage.deleteContent(parseInt(req.params.id));
    res.json({ success: true });
  });

  // ===== Bookings Endpoints =====
  
  app.get(api.bookings.list.path, async (req: AuthenticatedRequest, res) => {
    if (!req.isAuthenticated() || !req.user) return res.sendStatus(401);
    const bookings = await storage.getBookings(req.user.id);
    res.json(bookings);
  });

  app.post(api.bookings.create.path, async (req: AuthenticatedRequest, res) => {
    if (!req.isAuthenticated() || !req.user) return res.sendStatus(401);
    const booking = await storage.createBooking({
      ...req.body,
      userId: req.user.id,
      date: new Date(req.body.date),
    });
    res.status(201).json(booking);
  });

  // ===== Classes Endpoints =====
  
  app.get(api.classes.list.path, async (req, res) => {
    const classes = await storage.getClasses();
    res.json(classes);
  });

  // ===== User Management (Admin Only) =====
  
  app.get(api.users.list.path, async (req: AuthenticatedRequest, res) => {
    if (!isAdmin(req)) {
      return res.status(403).send("Unauthorized");
    }
    const users = await storage.getAllUsers();
    const safeUsers = users.map(({ password, ...rest }) => rest);
    res.json(safeUsers);
  });

  app.patch("/api/users/:id/role", async (req: AuthenticatedRequest, res) => {
    if (!isAdmin(req)) {
      return res.status(403).send("Unauthorized");
    }
    const { role } = req.body;
    const user = await storage.updateUserRole(parseInt(req.params.id), role);
    if (!user) return res.status(404).send("User not found");
    const { password, ...safeUser } = user;
    res.json(safeUser);
  });

  // ===== User Profile Endpoints =====
  
  app.patch("/api/profile", async (req: AuthenticatedRequest, res) => {
    if (!req.isAuthenticated() || !req.user) return res.sendStatus(401);
    const userId = req.user.id;
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

  app.post("/api/profile/password", async (req: AuthenticatedRequest, res) => {
    if (!req.isAuthenticated() || !req.user) return res.sendStatus(401);
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).send("Password must be at least 6 characters");
    }
    
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).send("User not found");
    
    // If user has existing password, verify current password
    if (user.password) {
      if (!currentPassword) {
        return res.status(400).send("Current password is required");
      }
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

  // ===== Payment Endpoints =====
  
  app.post("/api/payments", async (req: AuthenticatedRequest, res) => {
    if (!req.isAuthenticated() || !req.user) return res.sendStatus(401);
    const payment = await storage.createPayment({ ...req.body, userId: req.user.id });
    res.status(201).json(payment);
  });

  app.get("/api/payments", async (req: AuthenticatedRequest, res) => {
    if (!isAdmin(req)) {
      return res.status(403).send("Unauthorized");
    }
    const payments = await storage.getPayments();
    res.json(payments);
  });

  app.patch("/api/payments/:id/status", async (req: AuthenticatedRequest, res) => {
    if (!isAdmin(req)) {
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

  app.get("/api/purchases", async (req: AuthenticatedRequest, res) => {
    if (!req.isAuthenticated() || !req.user) return res.sendStatus(401);
    const purchases = await storage.getUserPurchases(req.user.id);
    res.json(purchases);
  });

  // ===== Payment Settings (Admin Only) =====
  
  app.get("/api/payment-settings", async (req, res) => {
    const settings = await storage.getPaymentSettings();
    res.json(settings);
  });

  app.put("/api/payment-settings", async (req: AuthenticatedRequest, res) => {
    if (!isAdmin(req)) {
      return res.status(403).send("Unauthorized");
    }
    const settings = await storage.updatePaymentSettings(req.body);
    res.json(settings);
  });

  // ===== Content Endpoints =====
  
  app.get(api.content.list.path, async (req, res) => {
    const contentList = await storage.getContent();
    res.json(contentList);
  });

  /**
   * Secure Download/Stream Endpoint
   * This endpoint generates a signed URL for ArvanCloud S3 objects.
   * It checks for authentication and purchase status (if content is premium).
   */
  app.get("/api/download", async (req: AuthenticatedRequest, res) => {
    if (!req.isAuthenticated() || !req.user) return res.status(401).send("Unauthorized");
    
    const contentId = parseInt(req.query.id as string);
    if (isNaN(contentId)) return res.status(400).send("Invalid content ID");
    
    const item = await storage.getContentById(contentId);
    if (!item) return res.status(404).send("Content not found");
    
    // Check access for premium content
    if (item.isPremium && !isAdmin(req)) {
      const purchases = await storage.getUserPurchases(req.user.id);
      const hasPurchased = purchases.some(p => p.contentId === item.id);
      if (!hasPurchased) {
        return res.status(403).send("You must purchase this content to access it.");
      }
    }
    
    // Get fileKey from content record (S3/Arvan Object Key)
    const fileKey = item.fileKey || item.videoId || item.contentUrl;
    if (!fileKey) return res.status(400).send("No file associated with this content");
    
    // Generate signed URL from ArvanCloud S3
    const { generateDownloadLink } = await import("./s3-storage");
    const stream = req.query.stream === "true";
    const signedUrl = await generateDownloadLink(fileKey, 3600, stream ? "inline" : "attachment");
    
    if (!signedUrl) {
      return res.status(500).send("Error generating access link");
    }
    
    // Redirect user to the signed URL
    res.redirect(signedUrl);
  });

  return httpServer;
}
