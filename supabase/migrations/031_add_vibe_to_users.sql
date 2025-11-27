-- Add vibe column to users table for daily vibe selection
ALTER TABLE users
ADD COLUMN IF NOT EXISTS vibe TEXT;

-- Create index for vibe queries
CREATE INDEX IF NOT EXISTS idx_users_vibe ON users(vibe);

-- Notify schema reload
NOTIFY pgrst, 'reload schema';

