-- Add interests column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';

-- Create index for interests (useful for matching queries)
CREATE INDEX IF NOT EXISTS idx_users_interests ON users USING GIN(interests);

