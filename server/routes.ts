
import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { contentRouter } from "./routes/content";
import { bookingsRouter } from "./routes/bookings";
import { classesRouter } from "./routes/classes";
import { usersRouter } from "./routes/users";
import { paymentsRouter } from "./routes/payments";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  app.use(contentRouter);
  app.use(bookingsRouter);
  app.use(classesRouter);
  app.use(usersRouter);
  app.use(paymentsRouter);

  return httpServer;
}
