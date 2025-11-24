-- Enhance messages table with read receipts, reactions, and file support
-- Migration 014: Advanced chat features

-- Add read receipts
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Add message reactions (JSONB to store emoji reactions: { "👍": ["user1_id", "user2_id"], "❤️": ["user3_id"] })
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb;

-- Add message type (text, image, file)
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file'));

-- Add file support columns
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS file_size INTEGER; -- Size in bytes

-- Create index on read_at for read receipt queries
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at);

-- Create GIN index on reactions for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_messages_reactions ON messages USING GIN (reactions);

-- Create index on message_type for filtering
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);

-- Enable Realtime for messages table (for instant message delivery)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Add comment for documentation
COMMENT ON COLUMN messages.read_at IS 'Timestamp when message was read by recipient';
COMMENT ON COLUMN messages.reactions IS 'JSONB object storing emoji reactions: { "emoji": ["user_id1", "user_id2"] }';
COMMENT ON COLUMN messages.message_type IS 'Type of message: text, image, or file';
COMMENT ON COLUMN messages.file_url IS 'Supabase Storage URL for uploaded files/images';
COMMENT ON COLUMN messages.file_name IS 'Original filename of uploaded file';
COMMENT ON COLUMN messages.file_size IS 'File size in bytes';

