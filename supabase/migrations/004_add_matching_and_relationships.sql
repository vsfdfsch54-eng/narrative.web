-- Add relationship_tier to chat_matches table
ALTER TABLE chat_matches
ADD COLUMN IF NOT EXISTS relationship_tier TEXT DEFAULT 'community' 
CHECK (relationship_tier IN ('community', 'close_friend', 'inner_circle'));

-- Create relationships table for tracking user relationships
CREATE TABLE IF NOT EXISTS relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship_tier TEXT NOT NULL DEFAULT 'community' 
    CHECK (relationship_tier IN ('community', 'close_friend', 'inner_circle')),
  message_count INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- Create index for relationships
CREATE INDEX IF NOT EXISTS idx_relationships_user1_id ON relationships(user1_id);
CREATE INDEX IF NOT EXISTS idx_relationships_user2_id ON relationships(user2_id);
CREATE INDEX IF NOT EXISTS idx_relationships_tier ON relationships(relationship_tier);

-- Create waiting queue table for users waiting to be matched
CREATE TABLE IF NOT EXISTS match_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for match queue
CREATE INDEX IF NOT EXISTS idx_match_queue_user_id ON match_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_match_queue_created_at ON match_queue(created_at);

-- Enable RLS on new tables
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for relationships
CREATE POLICY "Users can read own relationships" ON relationships
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can insert own relationships" ON relationships
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update own relationships" ON relationships
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS Policies for match_queue
CREATE POLICY "Users can manage own queue entry" ON match_queue
  FOR ALL USING (auth.uid() = user_id);

-- Function to update relationship tier based on message count
CREATE OR REPLACE FUNCTION update_relationship_tier()
RETURNS TRIGGER AS $$
DECLARE
  v_user1_id UUID;
  v_user2_id UUID;
  v_message_count INTEGER;
  v_new_tier TEXT;
BEGIN
  -- Get the match participants
  SELECT user1_id, user2_id INTO v_user1_id, v_user2_id
  FROM chat_matches
  WHERE id = NEW.match_id;
  
  -- Count total messages in this match
  SELECT COUNT(*) INTO v_message_count
  FROM messages
  WHERE match_id = NEW.match_id;
  
  -- Determine new tier based on message count
  IF v_message_count >= 50 THEN
    v_new_tier := 'inner_circle';
  ELSIF v_message_count >= 20 THEN
    v_new_tier := 'close_friend';
  ELSE
    v_new_tier := 'community';
  END IF;
  
  -- Update match relationship tier
  UPDATE chat_matches
  SET relationship_tier = v_new_tier
  WHERE id = NEW.match_id;
  
  -- Update or create relationship record
  INSERT INTO relationships (user1_id, user2_id, relationship_tier, message_count, last_interaction_at)
  VALUES (v_user1_id, v_user2_id, v_new_tier, v_message_count, NOW())
  ON CONFLICT (user1_id, user2_id)
  DO UPDATE SET
    relationship_tier = v_new_tier,
    message_count = v_message_count,
    last_interaction_at = NOW(),
    updated_at = NOW();
  
  -- Also create reverse relationship
  INSERT INTO relationships (user1_id, user2_id, relationship_tier, message_count, last_interaction_at)
  VALUES (v_user2_id, v_user1_id, v_new_tier, v_message_count, NOW())
  ON CONFLICT (user1_id, user2_id)
  DO UPDATE SET
    relationship_tier = v_new_tier,
    message_count = v_message_count,
    last_interaction_at = NOW(),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update relationship tier when a message is sent
CREATE TRIGGER update_relationship_on_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_relationship_tier();

-- Function to update updated_at timestamp for relationships
CREATE OR REPLACE FUNCTION update_relationships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for relationships updated_at
CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON relationships
    FOR EACH ROW EXECUTE FUNCTION update_relationships_updated_at();

