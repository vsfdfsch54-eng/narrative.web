-- Ensure onboarding_completed column exists
-- This migration is idempotent and safe to run multiple times
-- Fixes schema cache issues where column exists but Supabase doesn't recognize it

-- Add onboarding_completed column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'users' 
    AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE users 
    ADD COLUMN onboarding_completed BOOLEAN DEFAULT false NOT NULL;
    
    RAISE NOTICE 'Added onboarding_completed column to users table';
  ELSE
    RAISE NOTICE 'onboarding_completed column already exists';
  END IF;
END $$;

-- Ensure the column is NOT NULL with a default
ALTER TABLE users 
ALTER COLUMN onboarding_completed SET DEFAULT false;

-- Set NOT NULL constraint if not already set
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'users' 
    AND column_name = 'onboarding_completed'
    AND is_nullable = 'YES'
  ) THEN
    -- First, set default for any NULL values
    UPDATE users 
    SET onboarding_completed = false 
    WHERE onboarding_completed IS NULL;
    
    -- Then set NOT NULL
    ALTER TABLE users 
    ALTER COLUMN onboarding_completed SET NOT NULL;
    
    RAISE NOTICE 'Set onboarding_completed to NOT NULL';
  END IF;
END $$;

-- Sync onboarding_completed with onboarding_step
UPDATE users 
SET onboarding_completed = true
WHERE onboarding_step = 'complete' AND (onboarding_completed IS NULL OR onboarding_completed = false);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON users(onboarding_completed);

-- Refresh the schema cache by querying the column
DO $$ 
BEGIN
  PERFORM onboarding_completed FROM users LIMIT 1;
  RAISE NOTICE 'Schema cache refreshed for onboarding_completed column';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not refresh schema cache: %', SQLERRM;
END $$;

