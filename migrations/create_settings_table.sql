-- Create settings table for storing key-value configuration
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default payment settings if not exists
INSERT INTO settings (key, value) 
VALUES ('payment_settings', '{"bankCards": [], "cryptoWallets": []}')
ON CONFLICT (key) DO NOTHING;
