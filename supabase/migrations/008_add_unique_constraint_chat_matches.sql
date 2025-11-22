-- Add UNIQUE constraint to prevent duplicate matches between same two users
ALTER TABLE chat_matches
ADD CONSTRAINT IF NOT EXISTS unique_pair UNIQUE (user1_id, user2_id);

