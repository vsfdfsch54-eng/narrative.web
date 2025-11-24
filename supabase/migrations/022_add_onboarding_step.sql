-- Add onboarding_step column to users table
-- This is the single source of truth for onboarding progress
-- This migration is idempotent and safe to run multiple times

-- Add column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'onboarding_step'
  ) THEN
    ALTER TABLE users 
    ADD COLUMN onboarding_step TEXT DEFAULT 'start' NOT NULL;
  END IF;
END $$;

-- Drop constraint if it exists, then add it
ALTER TABLE users
DROP CONSTRAINT IF EXISTS check_onboarding_step;

ALTER TABLE users
ADD CONSTRAINT check_onboarding_step 
CHECK (onboarding_step IN ('start', 'email', 'name', 'password', 'interests', 'personality', 'complete'));

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_users_onboarding_step ON users(onboarding_step);

-- Update existing users to 'complete' if they have name and interests
-- Only update if onboarding_step is NULL or 'start' to avoid overwriting progress
UPDATE users 
SET onboarding_step = 'complete'
WHERE (onboarding_step IS NULL OR onboarding_step = 'start' OR onboarding_step = '')
  AND name IS NOT NULL 
  AND name != '' 
  AND interests IS NOT NULL 
  AND array_length(interests, 1) > 0;

-- Update existing users to 'interests' if they have name but no interests
-- Only update if onboarding_step is NULL or 'start' to avoid overwriting progress
UPDATE users 
SET onboarding_step = 'interests'
WHERE (onboarding_step IS NULL OR onboarding_step = 'start' OR onboarding_step = '')
  AND name IS NOT NULL 
  AND name != '' 
  AND (interests IS NULL OR array_length(interests, 1) = 0);

-- Update existing users to 'name' if they have email but no name
-- Only update if onboarding_step is NULL or 'start' to avoid overwriting progress
UPDATE users 
SET onboarding_step = 'name'
WHERE (onboarding_step IS NULL OR onboarding_step = 'start' OR onboarding_step = '')
  AND email IS NOT NULL 
  AND email != '' 
  AND (name IS NULL OR name = '');

-- All other existing users start at 'start' (only if still NULL or empty)
UPDATE users 
SET onboarding_step = 'start'
WHERE onboarding_step IS NULL OR onboarding_step = '';
