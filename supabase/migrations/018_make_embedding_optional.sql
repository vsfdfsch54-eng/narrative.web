-- Create waiting_pool table for AI-driven matching (with optional embedding)
-- This replaces the FIFO pending_matches concept with AI personality-based matching
-- Embedding is optional to support FIFO matching when GPT is unavailable
-- Uses JSONB to store embeddings (no pgvector required)

-- Create table if it doesn't exist (with optional embedding from the start)
CREATE TABLE IF NOT EXISTS waiting_pool (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  embedding JSONB, -- Optional: NULL means FIFO matching, JSONB array means AI matching
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If table already exists, make embedding optional
DO $$ 
BEGIN
  -- Check if table exists but embedding column doesn't
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'waiting_pool' 
    AND column_name = 'embedding'
  ) THEN
    -- Add embedding column if it doesn't exist
    ALTER TABLE waiting_pool ADD COLUMN embedding JSONB;
    RAISE NOTICE 'Added embedding column to waiting_pool';
  ELSIF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'waiting_pool' 
    AND column_name = 'embedding' 
    AND is_nullable = 'NO'
  ) THEN
    -- Make existing embedding column nullable
    ALTER TABLE waiting_pool ALTER COLUMN embedding DROP NOT NULL;
    RAISE NOTICE 'Made embedding column optional in waiting_pool';
  END IF;
END $$;

-- Create GIN index for JSONB embedding queries (for fast lookups)
CREATE INDEX IF NOT EXISTS idx_waiting_pool_embedding 
ON waiting_pool 
USING GIN (embedding)
WHERE embedding IS NOT NULL; -- Partial index - only index non-null embeddings

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_waiting_pool_user_id 
ON waiting_pool (user_id);

-- Create index for created_at (for cleanup of old entries)
CREATE INDEX IF NOT EXISTS idx_waiting_pool_created_at 
ON waiting_pool (created_at);

-- Enable Row Level Security
ALTER TABLE waiting_pool ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can read waiting pool" ON waiting_pool;
DROP POLICY IF EXISTS "Users can insert their own waiting pool entry" ON waiting_pool;
DROP POLICY IF EXISTS "Users can delete their own waiting pool entry" ON waiting_pool;
DROP POLICY IF EXISTS "Allow waiting pool updates" ON waiting_pool;

-- RLS Policies
-- Allow users to read all waiting pool entries (needed for matching algorithm)
CREATE POLICY "Anyone can read waiting pool" ON waiting_pool
  FOR SELECT USING (true);

-- Allow users to insert their own entry
CREATE POLICY "Users can insert their own waiting pool entry" ON waiting_pool
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own entry
CREATE POLICY "Users can delete their own waiting pool entry" ON waiting_pool
  FOR DELETE USING (auth.uid() = user_id);

-- Allow service role to update (for matching algorithm)
CREATE POLICY "Allow waiting pool updates" ON waiting_pool
  FOR UPDATE USING (true);

-- Enable Realtime for waiting_pool so frontend can listen for changes
-- Only add if not already in publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'waiting_pool'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE waiting_pool;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON TABLE waiting_pool IS 'Queue of users waiting to be matched. Uses AI personality embeddings for intelligent matching when available, otherwise uses FIFO matching.';
COMMENT ON COLUMN waiting_pool.embedding IS 'Personality embedding as JSONB array (optional). If NULL, user will use FIFO matching instead of AI matching.';
