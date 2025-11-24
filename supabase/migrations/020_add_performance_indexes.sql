-- Performance indexes for matching engine and queries

-- Index on waiting_pool for faster lookups
CREATE INDEX IF NOT EXISTS idx_waiting_pool_created_at ON waiting_pool(created_at);
CREATE INDEX IF NOT EXISTS idx_waiting_pool_user_id ON waiting_pool(user_id);

-- Index on chat_matches for faster user lookups
CREATE INDEX IF NOT EXISTS idx_chat_matches_user1_id ON chat_matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_chat_matches_user2_id ON chat_matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_chat_matches_status ON chat_matches(status);
CREATE INDEX IF NOT EXISTS idx_chat_matches_created_at ON chat_matches(created_at);

-- Index on messages for faster chat loading
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at) WHERE read_at IS NULL;

-- Index on users for faster personality lookups
CREATE INDEX IF NOT EXISTS idx_users_personality_embedding ON users(personality_embedding) WHERE personality_embedding IS NOT NULL;

-- Index on typing_status for realtime queries
CREATE INDEX IF NOT EXISTS idx_typing_status_match_user ON typing_status(match_id, user_id);

-- Index on user_presence for presence queries
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_is_online ON user_presence(is_online) WHERE is_online = true;

