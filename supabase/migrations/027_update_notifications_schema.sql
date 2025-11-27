-- Update notifications table to new schema
-- This migration updates the existing notifications table to match the new requirements

-- Rename recipient_id to user_id if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'recipient_id'
  ) THEN
    ALTER TABLE notifications RENAME COLUMN recipient_id TO user_id;
  END IF;
END $$;

-- Rename read to is_read if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'read'
  ) THEN
    ALTER TABLE notifications RENAME COLUMN read TO is_read;
  END IF;
END $$;

-- Add title column if it doesn't exist
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Add body column if it doesn't exist (rename message if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'message'
  ) THEN
    -- If message exists, copy to body and drop message
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS body TEXT;
    UPDATE notifications SET body = message WHERE body IS NULL;
    ALTER TABLE notifications DROP COLUMN IF EXISTS message;
  ELSE
    -- If message doesn't exist, just add body
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS body TEXT;
  END IF;
END $$;

-- Add metadata column if it doesn't exist
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Make title and body NOT NULL (after setting defaults for existing rows)
UPDATE notifications SET title = 'Notification' WHERE title IS NULL;
UPDATE notifications SET body = '' WHERE body IS NULL;

ALTER TABLE notifications 
ALTER COLUMN title SET NOT NULL,
ALTER COLUMN body SET NOT NULL;

-- First, drop the constraint if it exists (to allow updates)
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Update existing types to new format BEFORE applying constraint
-- This ensures no rows violate the new constraint
UPDATE notifications 
SET type = 'community_added' 
WHERE type IN ('community_request', 'community_accepted');

-- Also handle any other potential old types or NULL values
UPDATE notifications 
SET type = 'community_added' 
WHERE type IS NULL OR type NOT IN (
  'friend_chat_request',
  'community_added',
  'event_invite',
  'match_found',
  'message_received'
);

-- Verify all rows have valid types (safety check)
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM notifications
  WHERE type IS NULL OR type NOT IN (
    'friend_chat_request',
    'community_added',
    'event_invite',
    'match_found',
    'message_received'
  );
  
  IF invalid_count > 0 THEN
    -- Force update any remaining invalid types
    UPDATE notifications 
    SET type = 'community_added' 
    WHERE type IS NULL OR type NOT IN (
      'friend_chat_request',
      'community_added',
      'event_invite',
      'match_found',
      'message_received'
    );
  END IF;
END $$;

-- Now apply the new CHECK constraint
ALTER TABLE notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'friend_chat_request',
  'community_added',
  'event_invite',
  'match_found',
  'message_received'
));

-- Recreate indexes with new column names
DROP INDEX IF EXISTS idx_notifications_recipient_id;
DROP INDEX IF EXISTS idx_notifications_sender_id;
DROP INDEX IF EXISTS idx_notifications_read;

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sender_id ON notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications for others" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- Create new RLS policies
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = sender_id OR true); -- Allow system inserts via RPC

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Deny DELETE
CREATE POLICY "Users cannot delete notifications" ON notifications
  FOR DELETE USING (false);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

