-- Create user_presence table for online/offline status
-- Migration 016: User presence tracking

CREATE TABLE IF NOT EXISTS user_presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_match_id UUID REFERENCES chat_matches(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_is_online ON user_presence(is_online);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen_at ON user_presence(last_seen_at);

-- Enable Row Level Security
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read all presence (needed for showing online status)
CREATE POLICY "Users can read all presence" ON user_presence
  FOR SELECT USING (true);

-- Users can update their own presence
CREATE POLICY "Users can update own presence" ON user_presence
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own presence
CREATE POLICY "Users can insert own presence" ON user_presence
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable Realtime for user_presence table
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_user_presence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_user_presence_updated_at_trigger
  BEFORE UPDATE ON user_presence
  FOR EACH ROW
  EXECUTE FUNCTION update_user_presence_updated_at();

-- Add comment for documentation
COMMENT ON TABLE user_presence IS 'Tracks user online/offline status and last seen time';
COMMENT ON COLUMN user_presence.is_online IS 'Whether the user is currently online';
COMMENT ON COLUMN user_presence.last_seen_at IS 'Last time the user was seen online';
COMMENT ON COLUMN user_presence.current_match_id IS 'Current active chat match (if any)';

