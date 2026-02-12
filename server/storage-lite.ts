
import {
  users,
  content,
  timeSlots,
  bookings,
  classes,
  payments,
  purchases,
  paymentSettings,
  reviews,
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
  type Review,
  type InsertReview,
} from "../shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export class LiteStorage {
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

  async checkAndUpdateStreak(userId: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const today = new Date();
    const lastSeen = user.lastSeenAt ? new Date(user.lastSeenAt) : null;
    
    // Reset time parts for comparison
    const todayStr = today.toDateString();
    const lastSeenStr = lastSeen ? lastSeen.toDateString() : null;

    if (todayStr === lastSeenStr) {
      return user;
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    let newStreak = user.streak || 0;

    if (lastSeenStr === yesterdayStr) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }

    const [updatedUser] = await db.update(users)
      .set({ 
        streak: newStreak, 
        lastSeenAt: today 
      })
      .where(eq(users.id, userId))
      .returning();
      
    return updatedUser;
  }

  async getUserBySessionToken(sessionToken: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.sessionToken, sessionToken));
    return user;
  }

  async updateUserSession(userId: number, sessionToken: string | null): Promise<void> {
    await db.update(users).set({ sessionToken }).where(eq(users.id, userId));
  }

  // ===== Content =====
  async getContent(): Promise<Content[]> {
    return await db.select().from(content).orderBy(desc(content.createdAt));
  }

  async getContentById(id: number): Promise<Content | undefined> {
    const [c] = await db.select().from(content).where(eq(content.id, id));
    return c;
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

  async getPayments(): Promise<any[]> {
    const results = await db
      .select({
        payment: payments,
        username: users.username,
        phone: users.phone,
        contentTitle: content.title
      })
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .leftJoin(content, eq(payments.contentId, content.id))
      .orderBy(desc(payments.createdAt));
    
    return results.map(r => ({
      ...r.payment,
      username: r.username,
      phone: r.phone,
      contentTitle: r.contentTitle
    }));
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

  async getUserPurchases(userId: number): Promise<any[]> {
    const results = await db
      .select({
        purchase: purchases,
        content: content
      })
      .from(purchases)
      .leftJoin(content, eq(purchases.contentId, content.id))
      .where(eq(purchases.userId, userId));
    
    const distinctPurchases = new Map();
    results.forEach(r => {
      if (r.content && !distinctPurchases.has(r.purchase.contentId)) {
        distinctPurchases.set(r.purchase.contentId, {
          ...r.purchase,
          ...r.content,
          id: r.content.id,
          contentId: r.purchase.contentId
        });
      }
    });
    
    return Array.from(distinctPurchases.values());
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

  // ===== Reviews =====
  async getReviews(contentId: number): Promise<{ reviews: any[], stats: { total: number, avg: number } }> {
    const result = await db.select({
      id: reviews.id,
      userId: reviews.userId,
      contentId: reviews.contentId,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      user: {
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        avatar: users.avatar
      }
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.contentId, contentId))
    .orderBy(desc(reviews.createdAt));

    const total = result.length;
    const avg = total > 0 ? result.reduce((acc, curr) => acc + curr.rating, 0) / total : 0;

    return { reviews: result, stats: { total, avg } };
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [r] = await db.insert(reviews).values(review).returning();
    return r;
  }

  async updateReview(userId: number, contentId: number, rating: number, comment: string): Promise<void> {
    await db.update(reviews)
      .set({ rating, comment, createdAt: new Date() })
      .where(and(eq(reviews.userId, userId), eq(reviews.contentId, contentId)));
  }

  async deleteReview(reviewId: number): Promise<void> {
    await db.delete(reviews).where(eq(reviews.id, reviewId));
  }

  async getReviewById(reviewId: number): Promise<Review | undefined> {
    const [r] = await db.select().from(reviews).where(eq(reviews.id, reviewId));
    return r;
  }
}

export const storage = new LiteStorage();
