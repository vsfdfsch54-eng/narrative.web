-- Narrative V2.0 - Add Missing Indexes, RLS Policies, and Triggers
-- Safe to run on existing schema - uses IF NOT EXISTS
-- Run this AFTER you have the tables from 036_narrative_v2_schema.sql

-- ============================================
-- 1. INDEXES FOR PERFORMANCE
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
-- 2. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all V2 tables (safe - won't break if already enabled)
ALTER TABLE loops ENABLE ROW LEVEL SECURITY;
ALTER TABLE loop_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchmaking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loop_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can read loops they participate in" ON loops;
DROP POLICY IF EXISTS "Users can read loop participants" ON loop_participants;
DROP POLICY IF EXISTS "Users can read events they participate in" ON events;
DROP POLICY IF EXISTS "Users can read own matchmaking sessions" ON matchmaking_sessions;
DROP POLICY IF EXISTS "Users can read loop messages" ON loop_messages;
DROP POLICY IF EXISTS "Users can read own AI signals" ON ai_signals;
DROP POLICY IF EXISTS "Users can read own safety flags" ON safety_flags;
DROP POLICY IF EXISTS "Users can read own feedback" ON feedback;

-- Create RLS policies
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
-- 3. FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_loops_updated_at ON loops;
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
DROP TRIGGER IF EXISTS update_matchmaking_sessions_updated_at ON matchmaking_sessions;

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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS enforce_visibility_hierarchy_on_event_update ON events;

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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS remove_from_loop_events_on_loop_participant_delete ON loop_participants;

CREATE TRIGGER remove_from_loop_events_on_loop_participant_delete
  AFTER DELETE ON loop_participants
  FOR EACH ROW EXECUTE FUNCTION remove_participant_from_loop_events();

-- ============================================
-- 4. NOTIFY SCHEMA RELOAD
-- ============================================

NOTIFY pgrst, 'reload schema';

