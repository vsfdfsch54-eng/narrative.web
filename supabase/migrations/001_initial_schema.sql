-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vibes table
CREATE TABLE IF NOT EXISTS vibes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vibe TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Topics table (static reference data)
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  emoji TEXT,
  blurb TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat matches table
CREATE TABLE IF NOT EXISTS chat_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES chat_matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day INTEGER NOT NULL CHECK (day >= 1 AND day <= 31),
  title TEXT NOT NULL,
  location TEXT,
  time_slot TEXT,
  group_type TEXT CHECK (group_type IN ('inner', 'close', 'community')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES chat_matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at on users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vibes_user_id ON vibes(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_matches_user1_id ON chat_matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_chat_matches_user2_id ON chat_matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_chat_matches_status ON chat_matches(status);
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_day ON calendar_events(day);
CREATE INDEX IF NOT EXISTS idx_feedback_match_id ON feedback(match_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibes ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic - adjust based on your auth needs)
-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can insert their own record
CREATE POLICY "Users can insert own record" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can read their own vibes
CREATE POLICY "Users can read own vibes" ON vibes
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own vibes
CREATE POLICY "Users can insert own vibes" ON vibes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Topics are public (read-only for all)
CREATE POLICY "Topics are public" ON topics
  FOR SELECT USING (true);

-- Users can read matches they're part of
CREATE POLICY "Users can read own matches" ON chat_matches
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Users can read messages from their matches
CREATE POLICY "Users can read own match messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_matches
      WHERE chat_matches.id = messages.match_id
      AND (chat_matches.user1_id = auth.uid() OR chat_matches.user2_id = auth.uid())
    )
  );

-- Users can insert messages to their matches
CREATE POLICY "Users can insert own match messages" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chat_matches
      WHERE chat_matches.id = messages.match_id
      AND (chat_matches.user1_id = auth.uid() OR chat_matches.user2_id = auth.uid())
    )
  );

-- Users can read their own calendar events
CREATE POLICY "Users can read own calendar events" ON calendar_events
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own calendar events
CREATE POLICY "Users can insert own calendar events" ON calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read feedback from their matches
CREATE POLICY "Users can read own match feedback" ON feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_matches
      WHERE chat_matches.id = feedback.match_id
      AND (chat_matches.user1_id = auth.uid() OR chat_matches.user2_id = auth.uid())
    )
  );

-- Users can insert feedback for their matches
CREATE POLICY "Users can insert own match feedback" ON feedback
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chat_matches
      WHERE chat_matches.id = feedback.match_id
      AND (chat_matches.user1_id = auth.uid() OR chat_matches.user2_id = auth.uid())
    )
  );

