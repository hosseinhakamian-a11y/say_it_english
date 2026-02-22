
import { Router } from "express";
import { storage } from "../storage";
import { api } from "../../shared/routes";
import { AuthenticatedRequest, isAdmin, getAdminPhones } from "../utils/auth";
import crypto from "crypto";
import { promisify } from "util";

export const usersRouter = Router();

// Upgrade Admins (One-time migration or manual trigger)
usersRouter.post("/api/admin/upgrade-admins", async (req, res) => {
  try {
    const adminPhones = getAdminPhones();
    const users = await storage.getAllUsers();
    const upgraded: string[] = [];
    
    for (const user of users) {
      const isAdminPhone = adminPhones.includes(user.username) || 
                           (user.phone && adminPhones.includes(user.phone));
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

// List Users (Admin)
usersRouter.get(api.users.list.path, async (req: AuthenticatedRequest, res) => {
  if (!isAdmin(req)) {
    return res.status(403).send("Unauthorized");
  }
  const users = await storage.getAllUsers();
  const safeUsers = users.map(({ password, ...rest }) => rest);
  res.json(safeUsers);
});

// Update User Role (Admin)
usersRouter.patch("/api/users/:id/role", async (req: AuthenticatedRequest, res) => {
  if (!isAdmin(req)) {
    return res.status(403).send("Unauthorized");
  }
  const { role } = req.body;
  const user = await storage.updateUserRole(parseInt(req.params.id), role);
  if (!user) return res.status(404).send("User not found");
  const { password, ...safeUser } = user;
  res.json(safeUser);
});

// Update Profile
usersRouter.patch("/api/profile", async (req: AuthenticatedRequest, res) => {
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

// Update Password
import { authRateLimiter } from "../rate-limit";

usersRouter.post("/api/profile/password", authRateLimiter, async (req: AuthenticatedRequest, res) => {
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
    const scryptAsync = promisify(crypto.scrypt);
    
    const [hashed, salt] = user.password.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(currentPassword, salt, 64)) as Buffer;
    
    if (!crypto.timingSafeEqual(hashedBuf, suppliedBuf)) {
      return res.status(400).send("Current password is incorrect");
    }
  }
  
  // Hash new password
  const scryptAsync = promisify(crypto.scrypt);
  const newSalt = crypto.randomBytes(16).toString("hex");
  const buf = (await scryptAsync(newPassword, newSalt, 64)) as Buffer;
  const hashedPassword = `${buf.toString("hex")}.${newSalt}`;
  
  await storage.updateUser(userId, { password: hashedPassword });
  res.json({ message: "Password updated successfully" });
});
