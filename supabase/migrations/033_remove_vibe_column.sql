-- Remove vibe column from users table (replaced by mood)
-- Migration 033: Remove obsolete vibe column

-- Drop the index first
DROP INDEX IF EXISTS idx_users_vibe;

-- Remove the vibe column
ALTER TABLE users
DROP COLUMN IF EXISTS vibe;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';

