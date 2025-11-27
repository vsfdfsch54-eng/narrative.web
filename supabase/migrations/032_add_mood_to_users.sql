-- Add mood column to users table for daily mood selection
ALTER TABLE users
ADD COLUMN IF NOT EXISTS mood TEXT;

-- Create index for mood queries
CREATE INDEX IF NOT EXISTS idx_users_mood ON users(mood);

-- Notify schema reload
NOTIFY pgrst, 'reload schema';

