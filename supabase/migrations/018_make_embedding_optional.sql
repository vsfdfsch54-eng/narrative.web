-- Make embedding optional in waiting_pool to support FIFO matching
-- Users without personality embeddings can still join the waiting pool
-- The matchmaking processor will use FIFO matching for users without embeddings

ALTER TABLE waiting_pool 
ALTER COLUMN embedding DROP NOT NULL;

-- Update comment to reflect optional embedding
COMMENT ON COLUMN waiting_pool.embedding IS 'Personality embedding vector (optional). If NULL, user will use FIFO matching instead of AI matching.';

