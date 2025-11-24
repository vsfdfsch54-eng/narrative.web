-- Create typing_status table for real-time typing indicators
-- Migration 015: Typing indicators

CREATE TABLE IF NOT EXISTS typing_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES chat_matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_typing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, user_id)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_typing_status_match_id ON typing_status(match_id);
CREATE INDEX IF NOT EXISTS idx_typing_status_user_id ON typing_status(user_id);
CREATE INDEX IF NOT EXISTS idx_typing_status_updated_at ON typing_status(updated_at);

-- Enable Row Level Security
ALTER TABLE typing_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read typing status for their matches
CREATE POLICY "Users can read typing status for their matches" ON typing_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_matches
      WHERE chat_matches.id = typing_status.match_id
      AND (chat_matches.user1_id = auth.uid() OR chat_matches.user2_id = auth.uid())
    )
  );

-- Users can update their own typing status
CREATE POLICY "Users can update own typing status" ON typing_status
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own typing status
CREATE POLICY "Users can insert own typing status" ON typing_status
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable Realtime for typing_status table
ALTER PUBLICATION supabase_realtime ADD TABLE typing_status;

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_typing_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_typing_status_updated_at_trigger
  BEFORE UPDATE ON typing_status
  FOR EACH ROW
  EXECUTE FUNCTION update_typing_status_updated_at();

-- Add comment for documentation
COMMENT ON TABLE typing_status IS 'Tracks real-time typing status for users in chat matches';
COMMENT ON COLUMN typing_status.is_typing IS 'Whether the user is currently typing';

