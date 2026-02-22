import { Router } from "express";
import { storage } from "../storage";
import { api } from "../../shared/routes";
import { AuthenticatedRequest } from "../utils/auth";
import { transactionRateLimiter } from "../rate-limit";

export const bookingsRouter = Router();

bookingsRouter.get(api.bookings.list.path, async (req: AuthenticatedRequest, res) => {
  if (!req.isAuthenticated() || !req.user) return res.sendStatus(401);
  const bookings = await storage.getBookings(req.user.id);
  res.json(bookings);
});

bookingsRouter.post(api.bookings.create.path, transactionRateLimiter, async (req: AuthenticatedRequest, res) => {
  if (!req.isAuthenticated() || !req.user) return res.sendStatus(401);
  const booking = await storage.createBooking({
    ...req.body,
    userId: req.user.id,
    date: new Date(req.body.date),
  });
  res.status(201).json(booking);
});
