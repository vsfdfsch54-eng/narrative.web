-- QUICK FIX: Add interests column to users table
-- Copy and paste this into Supabase SQL Editor and run it

-- Add interests column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';

-- Create index for interests (useful for matching queries)
CREATE INDEX IF NOT EXISTS idx_users_interests ON users USING GIN(interests);

-- Verify it worked (optional - run this to check)
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' AND column_name = 'interests';

