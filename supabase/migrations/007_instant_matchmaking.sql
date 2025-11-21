-- Pending matches table for instant FIFO matching
CREATE TABLE IF NOT EXISTS pending_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vibe TEXT,
  topic TEXT,
  timeframe INTEGER,
  status TEXT NOT NULL DEFAULT 'searching' CHECK (status IN ('searching', 'matched', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  matched_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id) -- One pending match per user at a time
);

-- Enable Realtime for pending_matches so frontend can listen for status changes
ALTER PUBLICATION supabase_realtime ADD TABLE pending_matches;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pending_matches_status ON pending_matches(status, created_at);
CREATE INDEX IF NOT EXISTS idx_pending_matches_user_id ON pending_matches(user_id);

-- Enable RLS
ALTER TABLE pending_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Note: Service role key bypasses RLS automatically, but we still need policies for client-side access

-- Allow all reads (needed for matching logic and client-side queries)
CREATE POLICY "Anyone can read pending matches" ON pending_matches
  FOR SELECT USING (true);

-- Allow users to insert their own pending match
CREATE POLICY "Users can insert their own pending match" ON pending_matches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow updates for matching (service role bypasses RLS, but this allows client updates if needed)
CREATE POLICY "Allow pending match updates" ON pending_matches
  FOR UPDATE USING (true);

-- Allow users to delete their own pending match
CREATE POLICY "Users can delete their own pending match" ON pending_matches
  FOR DELETE USING (auth.uid() = user_id);

-- Update chat_matches to store vibe/topic/timeframe for both users
ALTER TABLE chat_matches 
  ADD COLUMN IF NOT EXISTS user1_vibe TEXT,
  ADD COLUMN IF NOT EXISTS user1_topic TEXT,
  ADD COLUMN IF NOT EXISTS user1_timeframe INTEGER,
  ADD COLUMN IF NOT EXISTS user2_vibe TEXT,
  ADD COLUMN IF NOT EXISTS user2_topic TEXT,
  ADD COLUMN IF NOT EXISTS user2_timeframe INTEGER;

-- Clean up old pending matches periodically (optional trigger)
CREATE OR REPLACE FUNCTION cleanup_old_pending_matches()
RETURNS void AS $$
BEGIN
  DELETE FROM pending_matches 
  WHERE status = 'searching' 
    AND created_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

