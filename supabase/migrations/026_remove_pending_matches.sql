-- Remove unused pending_matches table (replaced by waiting_pool)
-- This migration is safe to run even if table doesn't exist

DROP TABLE IF EXISTS pending_matches CASCADE;

