
import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: Express.User;
}

export function isAdmin(req: AuthenticatedRequest): boolean {
  return req.isAuthenticated() && req.user?.role === "admin";
}

export function getAdminPhones(): string[] {
  return process.env.ADMIN_PHONES?.split(",").map(p => p.trim()) || [];
}
