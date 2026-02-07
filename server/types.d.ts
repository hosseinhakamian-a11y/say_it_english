import { User } from "../shared/schema";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface User extends Omit<import("../shared/schema").User, "password" | "otp" | "otpExpires"> {
      id: number;
      username: string;
      role: string | null;
      phone: string | null;
    }
  }
}

export {};
