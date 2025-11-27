-- Drop vibes table (optional - only run if you don't need historical vibe data)
-- Migration 034: Remove obsolete vibes table

-- Drop the table and all related objects
DROP TABLE IF EXISTS vibes CASCADE;

-- Drop related indexes (if they exist separately)
DROP INDEX IF EXISTS idx_vibes_user_id;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';

