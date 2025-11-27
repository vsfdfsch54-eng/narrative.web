-- Create RPC function for creating notifications
-- This centralizes notification creation logic

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_sender_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS notifications
LANGUAGE plpgsql
SECURITY DEFINER -- Allows function to bypass RLS
AS $$
DECLARE
  v_notification notifications;
BEGIN
  -- Validate type
  IF p_type NOT IN (
    'friend_chat_request',
    'community_added',
    'event_invite',
    'match_found',
    'message_received'
  ) THEN
    RAISE EXCEPTION 'Invalid notification type: %', p_type;
  END IF;

  -- Insert notification
  INSERT INTO notifications (
    user_id,
    sender_id,
    type,
    title,
    body,
    metadata,
    is_read,
    created_at
  ) VALUES (
    p_user_id,
    p_sender_id,
    p_type,
    p_title,
    p_body,
    p_metadata,
    false,
    NOW()
  )
  RETURNING * INTO v_notification;

  RETURN v_notification;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification TO anon; -- For server-side calls

