import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("student"), // 'admin' (teacher) or 'student'
  level: text("level").default("beginner"), // beginner, intermediate, advanced
  createdAt: timestamp("created_at").defaultNow(),
});

export const content = pgTable("content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'podcast', 'article', 'video'
  level: text("level").notNull(), // 'beginner', 'intermediate', 'advanced'
  contentUrl: text("content_url"), // Optional now, used for audio/articles
  videoId: text("video_id"), // For Bunny/Aparat/YouTube ID
  videoProvider: text("video_provider"), // 'bunny', 'aparat', 'youtube', 'custom'
  isPremium: boolean("is_premium").default(false),
  price: integer("price").default(0), // Price in Toman (0 = free)
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'consultation', 'private_class'
  date: timestamp("date").notNull(),
  status: text("status").default("pending"), // 'pending', 'confirmed', 'cancelled'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  level: text("level").notNull(),
  capacity: integer("capacity").notNull(),
  price: integer("price").notNull(),
  schedule: text("schedule").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  classId: integer("class_id").notNull(),
  status: text("status").default("enrolled"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Manual Payment Requests (Card-to-Card)
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  contentId: integer("content_id").notNull(), // Which content they're buying
  amount: integer("amount").notNull(), // Amount in Toman
  trackingCode: text("tracking_code").notNull(), // Bank transfer tracking code
  status: text("status").default("pending"), // 'pending', 'approved', 'rejected'
  notes: text("notes"), // Admin notes
  createdAt: timestamp("created_at").defaultNow(),
});

// Purchased Content Access
export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  contentId: integer("content_id").notNull(),
  paymentId: integer("payment_id"), // Reference to the approved payment
  createdAt: timestamp("created_at").defaultNow(),
});

export const session = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// Blog Posts
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  coverImage: text("cover_image"),
  authorId: integer("author_id"),
  status: text("status").default("draft"), // 'draft', 'published'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertContentSchema = createInsertSchema(content).omit({ id: true, createdAt: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true, status: true });
export const insertClassSchema = createInsertSchema(classes).omit({ id: true, createdAt: true });
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, createdAt: true, status: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, status: true, notes: true });
export const insertPurchaseSchema = createInsertSchema(purchases).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Content = typeof content.$inferSelect;
export type InsertContent = z.infer<typeof insertContentSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;

