import { IStorage } from "./storage";
import { User, InsertUser, Content, InsertContent, Booking, InsertBooking, Class, InsertClass, Enrollment, InsertEnrollment, users, content, bookings, classes, enrollments } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getContent(): Promise<Content[]> {
    return await db.select().from(content);
  }

  async createContent(insertContent: InsertContent): Promise<Content> {
    const [newContent] = await db.insert(content).values(insertContent).returning();
    return newContent;
  }

  async getBookings(userId: number): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.userId, userId));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(insertBooking).returning();
    return booking;
  }

  async getClasses(): Promise<Class[]> {
    return await db.select().from(classes);
  }

  async createClass(insertClass: InsertClass): Promise<Class> {
    const [newClass] = await db.insert(classes).values(insertClass).returning();
    return newClass;
  }

  async enrollUser(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const [enrollment] = await db.insert(enrollments).values(insertEnrollment).returning();
    return enrollment;
  }
}

export const storage = new DatabaseStorage();
