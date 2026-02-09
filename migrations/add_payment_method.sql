-- Add payment_method column to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card';

-- Ensure status column exists with default 'pending'
ALTER TABLE payments ALTER COLUMN status SET DEFAULT 'pending';
