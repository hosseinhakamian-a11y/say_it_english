import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

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

  return httpServer;
}
