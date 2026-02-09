-- Add metadata column to content table for storing learning materials
ALTER TABLE content ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
