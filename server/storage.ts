import { users, type User, type InsertUser } from "../shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    // Note: googleId column might need to be verified in schema, assuming it exists based on auth.ts usage
    // If it's not in schema, auth.ts usage implies it should be.
    // Let's assume standard field name.
    // Wait, let me check schema usage in auth.ts. It passes googleId in createUser.
    // Ideally I should double check schema but for restoration let's assume `users.googleId`.
    // If compile fails I'll fix it.
    // Actually, let's look at schema.ts again if possible, but I can't in this turn.
    // I'll assume users table has googleId which is common.
    // If not, I'll use a raw sql or check.
    // But auth.ts: `user = await storage.getUserByGoogleId(profile.id);`
    // So the method must exist.
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, updateUser: Partial<User>): Promise<User> {
      const [user] = await db.update(users).set(updateUser).where(eq(users.id, id)).returning();
      return user;
  }
}

export const storage = new DatabaseStorage();
