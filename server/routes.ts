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

  // Seed data
  const existingContent = await storage.getContent();
  if (existingContent.length === 0) {
    await storage.createContent({
      title: "Introduction to Persian",
      type: "podcast",
      level: "beginner",
      contentUrl: "https://example.com/podcast1.mp3",
      description: "Basic greetings and numbers",
    });
    await storage.createContent({
      title: "Advanced Grammar",
      type: "article",
      level: "advanced",
      contentUrl: "https://example.com/article1",
      description: "Subjunctive mood in depth",
    });
  }

  const existingClasses = await storage.getClasses();
  if (existingClasses.length === 0) {
    await storage.createClass({
      title: "Beginner Group A",
      level: "beginner",
      capacity: 10,
      price: 500000,
      schedule: "Mon/Wed 18:00",
      description: "Start from scratch",
    });
  }

  return httpServer;
}
