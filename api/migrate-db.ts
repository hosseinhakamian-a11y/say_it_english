import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

// Isolated pool for migration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const client = await pool.connect();
  try {
    console.log("Migrating DB schema...");
    
    // Add new columns required for dashboard
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP;`);
    
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date TEXT;`);

    // Create payments and purchases tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        content_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        tracking_code TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        content_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Group classes (migrations/0008_group_classes.sql)
    await client.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        level TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        price INTEGER NOT NULL,
        schedule TEXT NOT NULL,
        meet_link TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        class_id INTEGER NOT NULL,
        status TEXT DEFAULT 'enrolled',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE classes ADD COLUMN IF NOT EXISTS meet_link TEXT;`);
    await client.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS class_id INTEGER;`);
    await client.query(`ALTER TABLE payments ALTER COLUMN content_id DROP NOT NULL;`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS uniq_enrollments_user_class ON enrollments(user_id, class_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_enrollments_class ON enrollments(class_id);`);

    // Instagram DM drafter (migrations/0009_ig_drafts.sql)
    await client.query(`
      CREATE TABLE IF NOT EXISTS ig_drafts (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        inbound TEXT NOT NULL,
        context TEXT,
        student_handle TEXT,
        draft TEXT NOT NULL,
        edited TEXT,
        sent_status TEXT DEFAULT 'drafted' NOT NULL,
        category TEXT
      );
    `);

    // Monetization (migrations/0007_monetization.sql) — verified missing from the live DB on
    // 2026-07-23: every drizzle query on payments/time_slots/bookings failed with
    // "column ... does not exist", and subscriptions/promo_codes did not exist at all.
    // The referral columns and the seeded WELCOME50/EARLYBIRD codes from 0007 are deliberately
    // NOT included: the referral code is commented out, and live discount codes are a business
    // decision, not a migration.
    await client.query(`
      CREATE TABLE IF NOT EXISTS promo_codes (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
        max_uses INTEGER,
        used_count INTEGER DEFAULT 0,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        is_active BOOLEAN DEFAULT TRUE
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        start_date TIMESTAMP NOT NULL DEFAULT NOW(),
        end_date TIMESTAMP NOT NULL,
        payment_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);`);

    // Columns the API's table definitions already assume
    await client.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway TEXT DEFAULT 'zarinpal';`);
    await client.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference_id TEXT;`);
    await client.query(`ALTER TABLE time_slots ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0;`);
    await client.query(`ALTER TABLE time_slots ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'IRT';`);
    await client.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meet_link TEXT;`);
    await client.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card';`);
    await client.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tracking_code TEXT;`);
    await client.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS transaction_hash TEXT;`);

    return res.status(200).json({ message: "Migration successful! Columns added and tables (payments, purchases, classes, enrollments, ig_drafts, promo_codes, subscriptions) created." });

  } catch (err: any) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  } finally {
    client.release();
  }
}
