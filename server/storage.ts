import {
  users,
  content,
  timeSlots,
  bookings,
  classes,
  payments,
  purchases,
  paymentSettings,
  type User,
  type InsertUser,
  type Content,
  type InsertContent,
  type TimeSlot,
  type InsertTimeSlot,
  type Booking,
  type InsertBooking,
  type Class,
  type Payment,
  type InsertPayment,
  type Purchase,
  type InsertPurchase,
} from "../shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
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
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;
  
  // Content
  getContent(): Promise<Content[]>;
  createContent(content: InsertContent): Promise<Content>;
  updateContent(id: number, content: Partial<Content>): Promise<Content | undefined>;
  deleteContent(id: number): Promise<void>;
  
  // Bookings
  getBookings(userId: number): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  
  // Classes
  getClasses(): Promise<Class[]>;
  
  // Payments
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayments(): Promise<Payment[]>;
  updatePaymentStatus(id: number, status: string, notes?: string): Promise<Payment | undefined>;
  
  // Purchases
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  getUserPurchases(userId: number): Promise<Purchase[]>;
  
  // Payment Settings
  getPaymentSettings(): Promise<{ bankCards: any[]; cryptoWallets: any[] }>;
  updatePaymentSettings(settings: { bankCards?: any[]; cryptoWallets?: any[] }): Promise<{ bankCards: any[]; cryptoWallets: any[] }>;
  
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

  // ===== Users =====
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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const [user] = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
    return user;
  }

  // ===== Content =====
  async getContent(): Promise<Content[]> {
    return await db.select().from(content).orderBy(desc(content.createdAt));
  }

  async createContent(insertContent: InsertContent): Promise<Content> {
    const [c] = await db.insert(content).values(insertContent).returning();
    return c;
  }

  async updateContent(id: number, updateContent: Partial<Content>): Promise<Content | undefined> {
    const [c] = await db.update(content).set(updateContent).where(eq(content.id, id)).returning();
    return c;
  }

  async deleteContent(id: number): Promise<void> {
    await db.delete(content).where(eq(content.id, id));
  }

  // ===== Time Slots =====
  async getSlots(): Promise<TimeSlot[]> {
    return await db.select().from(timeSlots).orderBy(timeSlots.date);
  }

  async createSlot(slot: InsertTimeSlot): Promise<TimeSlot> {
    const [s] = await db.insert(timeSlots).values(slot).returning();
    return s;
  }

  async deleteSlot(id: number): Promise<void> {
    await db.delete(timeSlots).where(eq(timeSlots.id, id));
  }

  async bookSlot(id: number): Promise<TimeSlot | undefined> {
    const [s] = await db.update(timeSlots).set({ isBooked: true }).where(eq(timeSlots.id, id)).returning();
    return s;
  }

  // ===== Bookings =====
  async getBookings(userId: number): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.userId, userId)).orderBy(desc(bookings.date));
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [b] = await db.insert(bookings).values(booking).returning();
    return b;
  }

  // ===== Classes =====
  async getClasses(): Promise<Class[]> {
    return await db.select().from(classes);
  }

  // ===== Payments =====
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [p] = await db.insert(payments).values(payment).returning();
    return p;
  }

  async getPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async updatePaymentStatus(id: number, status: string, notes?: string): Promise<Payment | undefined> {
    const [p] = await db.update(payments)
      .set({ status, notes })
      .where(eq(payments.id, id))
      .returning();
    return p;
  }

  // ===== Purchases =====
  async createPurchase(purchase: InsertPurchase): Promise<Purchase> {
    const [p] = await db.insert(purchases).values(purchase).returning();
    return p;
  }

  async getUserPurchases(userId: number): Promise<Purchase[]> {
    return await db.select().from(purchases).where(eq(purchases.userId, userId));
  }

  // ===== Payment Settings =====
  async getPaymentSettings(): Promise<{ bankCards: any[]; cryptoWallets: any[] }> {
    const settings = await db.select().from(paymentSettings);
    const bankCardsRow = settings.find(s => s.key === "bank_cards");
    const cryptoRow = settings.find(s => s.key === "crypto_wallets");
    return {
      bankCards: (bankCardsRow?.value as any[]) || [],
      cryptoWallets: (cryptoRow?.value as any[]) || [],
    };
  }

  async updatePaymentSettings(settings: { bankCards?: any[]; cryptoWallets?: any[] }): Promise<{ bankCards: any[]; cryptoWallets: any[] }> {
    if (settings.bankCards !== undefined) {
      await db.insert(paymentSettings)
        .values({ key: "bank_cards", value: settings.bankCards })
        .onConflictDoUpdate({
          target: paymentSettings.key,
          set: { value: settings.bankCards, updatedAt: new Date() },
        });
    }
    if (settings.cryptoWallets !== undefined) {
      await db.insert(paymentSettings)
        .values({ key: "crypto_wallets", value: settings.cryptoWallets })
        .onConflictDoUpdate({
          target: paymentSettings.key,
          set: { value: settings.cryptoWallets, updatedAt: new Date() },
        });
    }
    return this.getPaymentSettings();
  }
}

export const storage = new DatabaseStorage();
