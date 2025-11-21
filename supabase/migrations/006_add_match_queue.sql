-- Match queue table for real-time matching
CREATE TABLE IF NOT EXISTS match_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_match_queue_created_at ON match_queue(created_at);

-- Enable RLS
ALTER TABLE match_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read match queue" ON match_queue
  FOR SELECT USING (true);

CREATE POLICY "Users can insert themselves into queue" ON match_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete themselves from queue" ON match_queue
  FOR DELETE USING (auth.uid() = user_id);

