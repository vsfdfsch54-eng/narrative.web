-- New Matching System Schema
-- Replaces old waiting_pool and matchmaking logic with Tinder-style card stack matching

-- ============================================
-- 1. PROFILES TABLE (extends users table)
-- ============================================
-- Add fields to existing users table for matching profile
ALTER TABLE users
ADD COLUMN IF NOT EXISTS interests JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS vibe TEXT,
ADD COLUMN IF NOT EXISTS topic TEXT,
ADD COLUMN IF NOT EXISTS reputation_emojis JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS communities JSONB DEFAULT '[]'::jsonb;

-- ============================================
-- 2. MATCH_QUEUE TABLE
-- ============================================
-- Stores pending connections (when user A presses Connect on user B)
CREATE TABLE IF NOT EXISTS match_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_id)
);

CREATE INDEX IF NOT EXISTS idx_match_queue_user_id ON match_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_match_queue_target_id ON match_queue(target_id);
CREATE INDEX IF NOT EXISTS idx_match_queue_status ON match_queue(status);
CREATE INDEX IF NOT EXISTS idx_match_queue_created_at ON match_queue(created_at);

-- ============================================
-- 3. MATCHES TABLE (update existing chat_matches)
-- ============================================
-- Rename chat_matches to matches for clarity
-- Keep existing structure but add matched_at
ALTER TABLE chat_matches
ADD COLUMN IF NOT EXISTS matched_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- 4. CHATS TABLE (new chat rooms)
-- ============================================
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

CREATE INDEX IF NOT EXISTS idx_chats_user1_id ON chats(user1_id);
CREATE INDEX IF NOT EXISTS idx_chats_user2_id ON chats(user2_id);
CREATE INDEX IF NOT EXISTS idx_chats_room_id ON chats(room_id);

-- ============================================
-- 5. MESSAGES TABLE (update to use room_id)
-- ============================================
-- Add room_id column to messages (keep match_id for backward compatibility)
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES chats(room_id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);

-- ============================================
-- 6. RLS POLICIES
-- ============================================

-- Match Queue: Users can see their own pending connections
ALTER TABLE match_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own match queue entries" ON match_queue;
CREATE POLICY "Users can view their own match queue entries"
  ON match_queue FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = target_id);

DROP POLICY IF EXISTS "Users can insert their own match queue entries" ON match_queue;
CREATE POLICY "Users can insert their own match queue entries"
  ON match_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own match queue entries" ON match_queue;
CREATE POLICY "Users can update their own match queue entries"
  ON match_queue FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = target_id);

-- Chats: Users can see chats they're part of
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own chats" ON chats;
CREATE POLICY "Users can view their own chats"
  ON chats FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can insert chats they're part of" ON chats;
CREATE POLICY "Users can insert chats they're part of"
  ON chats FOR INSERT
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ============================================
-- 7. CLEANUP: Remove old waiting_pool table
-- ============================================
DROP TABLE IF EXISTS waiting_pool CASCADE;

-- ============================================
-- 8. HELPER FUNCTION: Check for mutual match
-- ============================================
CREATE OR REPLACE FUNCTION check_mutual_match(
  p_user_id UUID,
  p_target_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pending_exists BOOLEAN;
BEGIN
  -- Check if there's a pending connection from target to user
  SELECT EXISTS(
    SELECT 1 FROM match_queue
    WHERE user_id = p_target_id
      AND target_id = p_user_id
      AND status = 'pending'
  ) INTO v_pending_exists;
  
  RETURN v_pending_exists;
END;
$$;

GRANT EXECUTE ON FUNCTION check_mutual_match TO authenticated;

-- ============================================
-- 9. NOTIFY schema reload
-- ============================================
NOTIFY pgrst, 'reload schema';

