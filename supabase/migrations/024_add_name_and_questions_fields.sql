-- Add first_name, last_name, and questions_answers fields to users table
-- This migration is idempotent and safe to run multiple times

-- Add first_name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE users 
    ADD COLUMN first_name TEXT;
  END IF;
END $$;

-- Add last_name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE users 
    ADD COLUMN last_name TEXT;
  END IF;
END $$;

-- Add questions_answers column if it doesn't exist (JSONB for storing question responses)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'questions_answers'
  ) THEN
    ALTER TABLE users 
    ADD COLUMN questions_answers JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Update onboarding_step constraint to include new steps: password and questions
ALTER TABLE users
DROP CONSTRAINT IF EXISTS check_onboarding_step;

ALTER TABLE users
ADD CONSTRAINT check_onboarding_step 
CHECK (onboarding_step IN ('start', 'email', 'password', 'name', 'questions', 'interests', 'confirmation', 'complete'));

-- Create index for questions_answers (useful for queries)
CREATE INDEX IF NOT EXISTS idx_users_questions_answers ON users USING GIN(questions_answers);

