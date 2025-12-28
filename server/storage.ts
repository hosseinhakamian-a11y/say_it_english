import { User, InsertUser, Content, InsertContent, Booking, InsertBooking, Class, InsertClass, Enrollment, InsertEnrollment } from "@shared/schema";
import session from "express-session";
import MemoryStoreFactory from "memorystore";

const MemoryStore = MemoryStoreFactory(session);

export interface IStorage {
  sessionStore: session.Store;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getContent(): Promise<Content[]>;
  createContent(content: InsertContent): Promise<Content>;
  getBookings(userId: number): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  getClasses(): Promise<Class[]>;
  createClass(cls: InsertClass): Promise<Class>;
  enrollUser(enrollment: InsertEnrollment): Promise<Enrollment>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private content: Map<number, Content>;
  private bookings: Map<number, Booking>;
  private classes: Map<number, Class>;
  private enrollments: Map<number, Enrollment>;
  sessionStore: session.Store;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.content = new Map();
    this.bookings = new Map();
    this.classes = new Map();
    this.enrollments = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id, createdAt: new Date(), role: insertUser.role ?? "student", level: insertUser.level ?? "beginner" };
    this.users.set(id, user);
    return user;
  }

  async getContent(): Promise<Content[]> {
    return Array.from(this.content.values());
  }

  async createContent(insertContent: InsertContent): Promise<Content> {
    const id = this.currentId++;
    const item: Content = { ...insertContent, id, createdAt: new Date(), isPremium: insertContent.isPremium ?? false, description: insertContent.description ?? null };
    this.content.set(id, item);
    return item;
  }

  async getBookings(userId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) => booking.userId === userId,
    );
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = this.currentId++;
    const booking: Booking = { ...insertBooking, id, createdAt: new Date(), status: "pending", notes: insertBooking.notes ?? null };
    this.bookings.set(id, booking);
    return booking;
  }

  async getClasses(): Promise<Class[]> {
    return Array.from(this.classes.values());
  }

  async createClass(insertClass: InsertClass): Promise<Class> {
    const id = this.currentId++;
    const cls: Class = { ...insertClass, id, createdAt: new Date(), description: insertClass.description ?? null };
    this.classes.set(id, cls);
    return cls;
  }

  async enrollUser(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const id = this.currentId++;
    const enrollment: Enrollment = { ...insertEnrollment, id, createdAt: new Date(), status: "enrolled" };
    this.enrollments.set(id, enrollment);
    return enrollment;
  }
}

export const storage = new MemStorage();
