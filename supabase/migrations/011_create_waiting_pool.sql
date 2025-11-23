-- Create waiting_pool table for AI-driven matching
-- Replaces the FIFO pending_matches concept with AI personality-based matching

CREATE TABLE IF NOT EXISTS waiting_pool (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL, -- Copy from users.personality_embedding
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast vector similarity searches
-- This enables efficient "find best match" queries using cosine similarity
CREATE INDEX IF NOT EXISTS idx_waiting_pool_embedding 
ON waiting_pool 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_waiting_pool_user_id 
ON waiting_pool (user_id);

-- Create index for created_at (for cleanup of old entries)
CREATE INDEX IF NOT EXISTS idx_waiting_pool_created_at 
ON waiting_pool (created_at);

-- Enable Row Level Security
ALTER TABLE waiting_pool ENABLE ROW LEVEL SECURITY;

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
ALTER PUBLICATION supabase_realtime ADD TABLE waiting_pool;

-- Add comment for documentation
COMMENT ON TABLE waiting_pool IS 'Queue of users waiting to be matched. Uses AI personality embeddings for intelligent matching.';
COMMENT ON COLUMN waiting_pool.embedding IS 'Personality embedding vector copied from users.personality_embedding for fast similarity queries';
