-- Phase 2: User Progress & Learning System
-- Run this migration on the Supabase database

-- 1. User Progress Table
CREATE TABLE IF NOT EXISTS user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_id INTEGER NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    watched_percent INTEGER DEFAULT 0,
    quiz_score INTEGER DEFAULT 0,
    vocab_reviewed INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    xp_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, content_id)
);

-- 2. Badges Table
CREATE TABLE IF NOT EXISTS badges (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT NOT NULL,
    icon TEXT NOT NULL,
    description TEXT NOT NULL,
    condition TEXT NOT NULL,
    xp_reward INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. User Badges Table
CREATE TABLE IF NOT EXISTS user_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- 4. Add XP column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;

-- 5. Saved Vocabulary (My Vocabulary)
CREATE TABLE IF NOT EXISTS saved_vocabulary (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_id INTEGER NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    meaning TEXT NOT NULL,
    example TEXT,
    difficulty INTEGER DEFAULT 1,
    review_count INTEGER DEFAULT 0,
    last_reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, word)
);

-- 6. Insert default badges
INSERT INTO badges (name, name_en, icon, description, condition, xp_reward) VALUES
('اولین قدم', 'First Step', '👣', 'اولین درس را کامل کردید', 'complete_first_lesson', 50),
('پشتکار', 'Persistent', '🔥', '۷ روز متوالی فعال بودید', 'streak_7', 100),
('نبوغ', 'Genius', '🧠', 'نمره عالی در آزمون (بالای ۹۰٪)', 'quiz_score_90', 75),
('لغت‌دان', 'Wordsmith', '📚', '۵۰ لغت جدید یاد گرفتید', 'vocab_50', 100),
('ماراتن‌چی', 'Marathon', '🏃', '۱۰ درس را کامل کردید', 'complete_10_lessons', 150),
('آتش‌نشان', 'Firefighter', '🔥', '۳۰ روز متوالی فعال بودید', 'streak_30', 300),
('استاد', 'Master', '🎓', '۱۰۰۰ امتیاز کسب کردید', 'xp_1000', 200),
('کنجکاو', 'Curious', '🔍', 'از هر بخش حداقل یک درس دیدید', 'all_categories', 100)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_content ON user_progress(content_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_vocabulary_user ON saved_vocabulary(user_id);
