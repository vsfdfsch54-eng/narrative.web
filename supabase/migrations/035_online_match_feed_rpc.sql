-- Online Match Feed RPC Function
-- Migration 035: High-performance online-only matching

-- ============================================
-- 1. CREATE RPC FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION get_online_match_feed(current_user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  interests JSONB,
  mood TEXT,
  topic TEXT,
  reputation_emojis JSONB,
  communities JSONB,
  personality_summary TEXT,
  traits JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  onboarding_step TEXT,
  onboarding_completed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.name,
    u.avatar_url,
    u.interests,
    u.mood,
    u.topic,
    u.reputation_emojis,
    u.communities,
    u.personality_summary,
    u.traits,
    u.created_at,
    u.updated_at,
    u.onboarding_step,
    u.onboarding_completed
  FROM users u
  WHERE u.id != current_user_id

  -- Exclude users already in match_queue (pending or matched)
  AND u.id NOT IN (
    SELECT target_id 
    FROM match_queue 
    WHERE user_id = current_user_id
    AND status IN ('pending', 'matched')
  )

  -- Exclude users already matched in chat_matches
  AND u.id NOT IN (
    SELECT 
      CASE 
        WHEN user1_id = current_user_id THEN user2_id
        ELSE user1_id 
      END
    FROM chat_matches
    WHERE (user1_id = current_user_id OR user2_id = current_user_id)
    AND status = 'active'
  )

  -- ONLY include users who are online (strict requirement)
  AND u.id IN (
    SELECT user_id 
    FROM user_presence
    WHERE is_online = true
    AND last_seen_at >= NOW() - INTERVAL '5 minutes'
  )

  -- Prioritize mood/topic matches, then randomize
  ORDER BY 
    CASE WHEN u.mood = (SELECT mood FROM users WHERE id = current_user_id) THEN 1 ELSE 0 END DESC,
    CASE WHEN u.topic = (SELECT topic FROM users WHERE id = current_user_id) THEN 1 ELSE 0 END DESC,
    RANDOM()
  
  LIMIT 20;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_online_match_feed TO authenticated;
GRANT EXECUTE ON FUNCTION get_online_match_feed TO anon;

-- ============================================
-- 2. PERFORMANCE INDEXES
-- ============================================

-- Partial index for online users only
CREATE INDEX IF NOT EXISTS idx_presence_online 
ON user_presence (user_id) 
WHERE is_online = true;

-- Index for recent online activity
CREATE INDEX IF NOT EXISTS idx_presence_recent 
ON user_presence (last_seen_at DESC) 
WHERE is_online = true;

-- Composite index for online + recent queries
CREATE INDEX IF NOT EXISTS idx_presence_online_recent 
ON user_presence (is_online, last_seen_at DESC) 
WHERE is_online = true;

-- ============================================
-- 3. NOTIFY SCHEMA RELOAD
-- ============================================

NOTIFY pgrst, 'reload schema';

