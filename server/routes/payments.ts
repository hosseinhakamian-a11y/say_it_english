import { Router } from "express";
import { storage } from "../storage";
import { AuthenticatedRequest, isAdmin } from "../utils/auth";
import { transactionRateLimiter } from "../rate-limit";

export const paymentsRouter = Router();

// Create Payment
paymentsRouter.post("/api/payments", transactionRateLimiter, async (req: AuthenticatedRequest, res) => {
  if (!req.isAuthenticated() || !req.user) return res.sendStatus(401);
  const payment = await storage.createPayment({ ...req.body, userId: req.user.id });
  res.status(201).json(payment);
});

// Get Payments (Admin)
paymentsRouter.get("/api/payments", async (req: AuthenticatedRequest, res) => {
  if (!isAdmin(req)) {
    return res.status(403).send("Unauthorized");
  }
  const payments = await storage.getPayments();
  res.json(payments);
});

// Update Payment Status (Admin)
paymentsRouter.patch("/api/payments/:id/status", async (req: AuthenticatedRequest, res) => {
  if (!isAdmin(req)) {
    return res.status(403).send("Unauthorized");
  }
  const { status, notes } = req.body;
  const payment = await storage.updatePaymentStatus(parseInt(req.params.id), status, notes);
  if (!payment) return res.status(404).send("Payment not found");

  // If approved, automatically grant access to the user
  if (status === "approved" && payment.contentId) {
    await storage.createPurchase({
      userId: payment.userId,
      contentId: payment.contentId,
      paymentId: payment.id,
    });
  }

  res.json(payment);
});

// Get User Purchases
paymentsRouter.get("/api/purchases", async (req: AuthenticatedRequest, res) => {
  if (!req.isAuthenticated() || !req.user) return res.sendStatus(401);
  const purchases = await storage.getUserPurchases(req.user.id);
  res.json(purchases);
});

// Get Payment Settings
paymentsRouter.get("/api/payment-settings", async (req, res) => {
  const settings = await storage.getPaymentSettings();
  res.json(settings);
});

// Update Payment Settings (Admin)
paymentsRouter.put("/api/payment-settings", async (req: AuthenticatedRequest, res) => {
  if (!isAdmin(req)) {
    return res.status(403).send("Unauthorized");
  }
  const settings = await storage.updatePaymentSettings(req.body);
  res.json(settings);
});
