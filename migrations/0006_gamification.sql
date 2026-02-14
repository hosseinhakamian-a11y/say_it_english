-- Phase 3: Gamification System
-- Run this migration on the Supabase database

-- 1. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Weekly Challenges Table
CREATE TABLE IF NOT EXISTS weekly_challenges (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '🎯',
    challenge_type TEXT NOT NULL,
    target_value INTEGER NOT NULL DEFAULT 1,
    xp_reward INTEGER NOT NULL DEFAULT 50,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. User Challenge Progress Table
CREATE TABLE IF NOT EXISTS user_challenges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id INTEGER NOT NULL REFERENCES weekly_challenges(id) ON DELETE CASCADE,
    current_value INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, challenge_id)
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_challenges_active ON weekly_challenges(is_active);

-- 5. Insert default weekly challenges
INSERT INTO weekly_challenges (title, description, icon, challenge_type, target_value, xp_reward, start_date, end_date) VALUES
('یادگیر حرفه‌ای', '۵ درس کامل در این هفته', '📚', 'complete_lessons', 5, 100, NOW(), NOW() + INTERVAL '7 days'),
('لغت‌ساز', '۲۰ لغت جدید ذخیره کن', '📝', 'save_vocab', 20, 75, NOW(), NOW() + INTERVAL '7 days'),
('آزمون‌باز', '۳ آزمون با نمره بالای ۸۰٪ بده', '🧠', 'quiz_high_score', 3, 120, NOW(), NOW() + INTERVAL '7 days'),
('پشتکار', '۵ روز متوالی فعال باش', '🔥', 'streak_days', 5, 80, NOW(), NOW() + INTERVAL '7 days')
ON CONFLICT DO NOTHING;
