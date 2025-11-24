-- Remove legacy match_queue table (replaced by waiting_pool)
-- This migration is safe to run even if table doesn't exist

DROP TABLE IF EXISTS match_queue CASCADE;

