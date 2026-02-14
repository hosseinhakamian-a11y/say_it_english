-- Phase 4: Monetization & Growth
-- Run this migration on the Supabase database

-- 1. Promo Codes Table
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

-- 2. Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL, -- 'bronze', 'silver', 'gold'
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired', 'cancelled'
    start_date TIMESTAMP NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP NOT NULL,
    payment_id INTEGER, -- Reference to payments table if needed
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Add Referral Fields to Users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS wallet_balance INTEGER DEFAULT 0; -- For referral rewards

-- 4. Update Payments Table for Subscriptions
ALTER TABLE payments
ALTER COLUMN content_id DROP NOT NULL;

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS gateway TEXT DEFAULT 'zarinpal',
ADD COLUMN IF NOT EXISTS reference_id TEXT;

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- 6. Insert default promo codes
INSERT INTO promo_codes (code, discount_percent, max_uses, expires_at) VALUES
('WELCOME50', 50, 100, NOW() + INTERVAL '30 days'),
('EARLYBIRD', 20, 500, NOW() + INTERVAL '90 days')
ON CONFLICT DO NOTHING;
