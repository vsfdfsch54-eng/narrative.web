-- Narrative V2.0 Schema Migration
-- Complete rebuild with new architecture: Loops, Events, Matchmaking Sessions

-- ============================================
-- 1. LOOPS (The only relational container)
-- ============================================

CREATE TABLE IF NOT EXISTS loops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  visibility_layer TEXT NOT NULL CHECK (visibility_layer IN ('private', 'close-friends', 'inner-circle', 'community', 'public')),
  growth_enabled BOOLEAN NOT NULL DEFAULT true,
  past_activity_enabled BOOLEAN NOT NULL DEFAULT true,
  feed_sync_enabled BOOLEAN NOT NULL DEFAULT true,
  private_link TEXT UNIQUE, -- Unique private link for bypassing visibility
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loop_participants (
  loop_id UUID NOT NULL REFERENCES loops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (loop_id, user_id)
);

-- ============================================
-- 2. EVENTS
-- ============================================

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loop_id UUID REFERENCES loops(id) ON DELETE SET NULL, -- Associated Loop (optional)
  title TEXT NOT NULL,
  date_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  visibility_layer TEXT NOT NULL CHECK (visibility_layer IN ('private', 'close-friends', 'inner-circle', 'community', 'public')),
  growth_enabled BOOLEAN NOT NULL DEFAULT true,
  participant_list_visible BOOLEAN NOT NULL DEFAULT true,
  past_activity_enabled BOOLEAN NOT NULL DEFAULT true,
  sync_to_feed BOOLEAN NOT NULL DEFAULT true,
  private_link TEXT UNIQUE, -- Unique private link for bypassing visibility
  guest_mode_enabled BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_participants (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined', 'maybe')),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

-- ============================================
-- 3. MATCHMAKING SESSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS matchmaking_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood TEXT NOT NULL, -- User1's mood choice
  intention TEXT NOT NULL, -- User1's intention choice
  topic TEXT NOT NULL, -- User1's topic choice
  match_score DECIMAL(5,2), -- 0.00 to 100.00
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preview', 'ephemeral_chat', 'messaging_only', 'matched', 'dissolved', 'blocked')),
  preview_started_at TIMESTAMPTZ,
  ephemeral_chat_duration INTEGER, -- Duration in seconds (metadata only, no content)
  user1_swipe TEXT CHECK (user1_swipe IN ('left', 'right', NULL)),
  user2_swipe TEXT CHECK (user2_swipe IN ('left', 'right', NULL)),
  stay_connected_at TIMESTAMPTZ, -- When both swiped right and chose "Stay Connected"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user1_id, user2_id, created_at) -- Prevent duplicate sessions
);

-- ============================================
-- 4. LOOP MESSAGES (Persistent messaging inside Loops)
-- ============================================

CREATE TABLE IF NOT EXISTS loop_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loop_id UUID NOT NULL REFERENCES loops(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. AI SIGNALS (Behavior only, NO content)
-- ============================================

CREATE TABLE IF NOT EXISTS ai_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL CHECK (signal_type IN (
    'mood_chosen',
    'intention_chosen',
    'topic_chosen',
    'swipe_pattern',
    'chat_duration',
    'stay_connected',
    'loop_activity',
    'call_duration',
    'call_extension',
    'event_attendance',
    'visibility_change',
    'growth_toggle',
    'safety_signal'
  )),
  signal_data JSONB NOT NULL, -- Structured data about behavior, NOT content
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 6. SAFETY FLAGS
-- ============================================

CREATE TABLE IF NOT EXISTS safety_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flagged_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL CHECK (flag_type IN ('harassment', 'hate', 'inappropriate', 'safety_risk')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'escalated')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id)
);

-- ============================================
-- 7. FEEDBACK
-- ============================================

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID REFERENCES users(id) ON DELETE SET NULL, -- User or Loop or Event
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('user', 'loop', 'event', 'matchmaking', 'call')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 8. UPDATE USERS TABLE FOR V2
-- ============================================

-- Add schema_version flag to track V2 adoption
ALTER TABLE users ADD COLUMN IF NOT EXISTS schema_version TEXT DEFAULT 'v1';
ALTER TABLE users ADD COLUMN IF NOT EXISTS conversation_nickname TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mood_preferences JSONB; -- Array of preferred moods
ALTER TABLE users ADD COLUMN IF NOT EXISTS intention_preferences JSONB; -- Array of preferred intentions
ALTER TABLE users ADD COLUMN IF NOT EXISTS topic_preferences JSONB; -- Array of preferred topics

-- ============================================
-- 9. INDEXES FOR PERFORMANCE
-- ============================================

-- Loops indexes
CREATE INDEX IF NOT EXISTS idx_loops_visibility ON loops(visibility_layer);
CREATE INDEX IF NOT EXISTS idx_loops_private_link ON loops(private_link) WHERE private_link IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_loop_participants_user ON loop_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_loop_participants_loop ON loop_participants(loop_id);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_loop ON events(loop_id) WHERE loop_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_date_time ON events(date_time);
CREATE INDEX IF NOT EXISTS idx_events_visibility ON events(visibility_layer);
CREATE INDEX IF NOT EXISTS idx_events_private_link ON events(private_link) WHERE private_link IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_participants_event ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user ON event_participants(user_id);

-- Matchmaking indexes
CREATE INDEX IF NOT EXISTS idx_matchmaking_user1 ON matchmaking_sessions(user1_id);
CREATE INDEX IF NOT EXISTS idx_matchmaking_user2 ON matchmaking_sessions(user2_id);
CREATE INDEX IF NOT EXISTS idx_matchmaking_status ON matchmaking_sessions(status);
CREATE INDEX IF NOT EXISTS idx_matchmaking_created ON matchmaking_sessions(created_at DESC);

-- Loop messages indexes
CREATE INDEX IF NOT EXISTS idx_loop_messages_loop ON loop_messages(loop_id);
CREATE INDEX IF NOT EXISTS idx_loop_messages_sender ON loop_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_loop_messages_created ON loop_messages(created_at DESC);

-- AI signals indexes
CREATE INDEX IF NOT EXISTS idx_ai_signals_user ON ai_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_signals_type ON ai_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_ai_signals_created ON ai_signals(created_at DESC);

-- Safety flags indexes
CREATE INDEX IF NOT EXISTS idx_safety_flags_user ON safety_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_flags_flagged ON safety_flags(flagged_user_id);
CREATE INDEX IF NOT EXISTS idx_safety_flags_status ON safety_flags(status);
CREATE INDEX IF NOT EXISTS idx_safety_flags_type ON safety_flags(flag_type);

-- ============================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE loops ENABLE ROW LEVEL SECURITY;
ALTER TABLE loop_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchmaking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loop_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (will be refined based on visibility rules)
-- Users can read loops they're participants in
CREATE POLICY "Users can read loops they participate in" ON loops
  FOR SELECT USING (
    id IN (SELECT loop_id FROM loop_participants WHERE user_id = auth.uid())
  );

-- Users can read loop participants for loops they're in
CREATE POLICY "Users can read loop participants" ON loop_participants
  FOR SELECT USING (
    loop_id IN (SELECT loop_id FROM loop_participants WHERE user_id = auth.uid())
  );

-- Users can read events they're participants in or events in their loops
CREATE POLICY "Users can read events they participate in" ON events
  FOR SELECT USING (
    id IN (SELECT event_id FROM event_participants WHERE user_id = auth.uid())
    OR loop_id IN (SELECT loop_id FROM loop_participants WHERE user_id = auth.uid())
  );

-- Users can read their own matchmaking sessions
CREATE POLICY "Users can read own matchmaking sessions" ON matchmaking_sessions
  FOR SELECT USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- Users can read messages in loops they're participants in
CREATE POLICY "Users can read loop messages" ON loop_messages
  FOR SELECT USING (
    loop_id IN (SELECT loop_id FROM loop_participants WHERE user_id = auth.uid())
  );

-- Users can read their own AI signals
CREATE POLICY "Users can read own AI signals" ON ai_signals
  FOR SELECT USING (user_id = auth.uid());

-- Users can read safety flags they created
CREATE POLICY "Users can read own safety flags" ON safety_flags
  FOR SELECT USING (user_id = auth.uid());

-- Users can read their own feedback
CREATE POLICY "Users can read own feedback" ON feedback
  FOR SELECT USING (user_id = auth.uid());

-- ============================================
-- 11. FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_loops_updated_at BEFORE UPDATE ON loops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matchmaking_sessions_updated_at BEFORE UPDATE ON matchmaking_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to enforce Event visibility >= Loop visibility
CREATE OR REPLACE FUNCTION enforce_event_loop_visibility()
RETURNS TRIGGER AS $$
DECLARE
  loop_visibility TEXT;
  visibility_order TEXT[] := ARRAY['private', 'close-friends', 'inner-circle', 'community', 'public'];
  event_vis_index INTEGER;
  loop_vis_index INTEGER;
BEGIN
  -- If event has associated loop, check visibility hierarchy
  IF NEW.loop_id IS NOT NULL THEN
    SELECT visibility_layer INTO loop_visibility FROM loops WHERE id = NEW.loop_id;
    
    -- Find index of event and loop visibility in order array
    event_vis_index := array_position(visibility_order, NEW.visibility_layer);
    loop_vis_index := array_position(visibility_order, loop_visibility);
    
    -- If event visibility is more restrictive than loop, shrink loop visibility
    IF event_vis_index < loop_vis_index THEN
      UPDATE loops 
      SET visibility_layer = NEW.visibility_layer 
      WHERE id = NEW.loop_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_visibility_hierarchy_on_event_update
  AFTER INSERT OR UPDATE OF visibility_layer ON events
  FOR EACH ROW EXECUTE FUNCTION enforce_event_loop_visibility();

-- Function to remove participant from all loop-connected events
CREATE OR REPLACE FUNCTION remove_participant_from_loop_events()
RETURNS TRIGGER AS $$
BEGIN
  -- When a participant is removed from a loop, remove them from all events in that loop
  DELETE FROM event_participants
  WHERE event_id IN (
    SELECT id FROM events WHERE loop_id = OLD.loop_id
  )
  AND user_id = OLD.user_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER remove_from_loop_events_on_loop_participant_delete
  AFTER DELETE ON loop_participants
  FOR EACH ROW EXECUTE FUNCTION remove_participant_from_loop_events();

-- ============================================
-- 12. NOTIFY SCHEMA RELOAD
-- ============================================

NOTIFY pgrst, 'reload schema';

