-- Add onboarding fields to users table
-- This migration is idempotent and safe to run multiple times

-- Add vibe column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'vibe'
  ) THEN
    ALTER TABLE users 
    ADD COLUMN vibe TEXT;
  END IF;
END $$;

-- Add topic column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'topic'
  ) THEN
    ALTER TABLE users 
    ADD COLUMN topic TEXT;
  END IF;
END $$;

-- Add timeframe column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'timeframe'
  ) THEN
    ALTER TABLE users 
    ADD COLUMN timeframe INTEGER;
  END IF;
END $$;

-- Add onboarding_completed column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE users 
    ADD COLUMN onboarding_completed BOOLEAN DEFAULT false NOT NULL;
  END IF;
END $$;

-- Update onboarding_step constraint to include new steps
ALTER TABLE users
DROP CONSTRAINT IF EXISTS check_onboarding_step;

ALTER TABLE users
ADD CONSTRAINT check_onboarding_step 
CHECK (onboarding_step IN ('start', 'email', 'name', 'vibe', 'topic', 'timeframe', 'confirmation', 'complete'));

-- Set onboarding_completed to true for users with onboarding_step = 'complete'
UPDATE users 
SET onboarding_completed = true
WHERE onboarding_step = 'complete' AND (onboarding_completed IS NULL OR onboarding_completed = false);

