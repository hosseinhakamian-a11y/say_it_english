import { User, InsertUser, Content, InsertContent, Booking, InsertBooking, Class, InsertClass, Enrollment, InsertEnrollment, Payment, InsertPayment, Purchase, InsertPurchase, users, content, bookings, classes, enrollments, payments, purchases } from "@shared/schema";
import session from "express-session";
import MemoryStoreFactory from "memorystore";
import connectPgSimple from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and } from "drizzle-orm";

const MemoryStore = MemoryStoreFactory(session);
const PostgresSessionStore = connectPgSimple(session);

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
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;
  deleteContent(id: number): Promise<boolean>;
  updateContent(id: number, data: Partial<InsertContent>): Promise<Content | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayments(): Promise<Payment[]>;
  updatePaymentStatus(id: number, status: string, notes?: string): Promise<Payment | undefined>;
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  getUserPurchases(userId: number): Promise<Purchase[]>;
  hasUserPurchased(userId: number, contentId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: false,
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
    const [item] = await db.insert(content).values(insertContent).returning();
    return item;
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
    const [cls] = await db.insert(classes).values(insertClass).returning();
    return cls;
  }

  async enrollUser(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const [enrollment] = await db.insert(enrollments).values(insertEnrollment).returning();
    return enrollment;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const [user] = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteContent(id: number): Promise<boolean> {
    const result = await db.delete(content).where(eq(content.id, id));
    return true;
  }

  async updateContent(id: number, data: Partial<InsertContent>): Promise<Content | undefined> {
    const [updated] = await db.update(content).set(data).where(eq(content.id, id)).returning();
    return updated;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async getPayments(): Promise<Payment[]> {
    return await db.select().from(payments);
  }

  async updatePaymentStatus(id: number, status: string, notes?: string): Promise<Payment | undefined> {
    const [updated] = await db.update(payments).set({ status, notes }).where(eq(payments.id, id)).returning();
    return updated;
  }

  async createPurchase(purchase: InsertPurchase): Promise<Purchase> {
    const [newPurchase] = await db.insert(purchases).values(purchase).returning();
    return newPurchase;
  }

  async getUserPurchases(userId: number): Promise<Purchase[]> {
    return await db.select().from(purchases).where(eq(purchases.userId, userId));
  }

  async hasUserPurchased(userId: number, contentId: number): Promise<boolean> {
    const result = await db.select().from(purchases)
      .where(and(eq(purchases.userId, userId), eq(purchases.contentId, contentId)));
    return result.length > 0;
  }
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
    const item: Content = {
      ...insertContent,
      id,
      createdAt: new Date(),
      isPremium: insertContent.isPremium ?? false,
      description: insertContent.description ?? null,
      contentUrl: insertContent.contentUrl ?? null,
      videoId: insertContent.videoId ?? null,
      videoProvider: insertContent.videoProvider ?? null,
      price: insertContent.price ?? null,
    };
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

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      user.role = role;
      this.users.set(id, user);
    }
    return user;
  }

  async deleteContent(id: number): Promise<boolean> {
    return this.content.delete(id);
  }

  async updateContent(id: number, data: Partial<InsertContent>): Promise<Content | undefined> {
    const existing = this.content.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.content.set(id, updated as Content);
    return updated as Content;
  }

  private paymentsMap: Map<number, Payment> = new Map();

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const id = this.currentId++;
    const newPayment: Payment = { ...payment, id, status: "pending", notes: null, createdAt: new Date() };
    this.paymentsMap.set(id, newPayment);
    return newPayment;
  }

  async getPayments(): Promise<Payment[]> {
    return Array.from(this.paymentsMap.values());
  }

  async updatePaymentStatus(id: number, status: string, notes?: string): Promise<Payment | undefined> {
    const payment = this.paymentsMap.get(id);
    if (!payment) return undefined;
    payment.status = status;
    if (notes) payment.notes = notes;
    this.paymentsMap.set(id, payment);
    return payment;
  }

  private purchasesMap: Map<number, Purchase> = new Map();

  async createPurchase(purchase: InsertPurchase): Promise<Purchase> {
    const id = this.currentId++;
    const newPurchase: Purchase = { ...purchase, id, paymentId: purchase.paymentId ?? null, createdAt: new Date() };
    this.purchasesMap.set(id, newPurchase);
    return newPurchase;
  }

  async getUserPurchases(userId: number): Promise<Purchase[]> {
    return Array.from(this.purchasesMap.values()).filter(p => p.userId === userId);
  }

  async hasUserPurchased(userId: number, contentId: number): Promise<boolean> {
    return Array.from(this.purchasesMap.values()).some(p => p.userId === userId && p.contentId === contentId);
  }
}

export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
