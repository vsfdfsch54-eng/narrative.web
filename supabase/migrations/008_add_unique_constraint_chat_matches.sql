-- Add UNIQUE constraint to prevent duplicate matches between same two users
-- First, drop the constraint if it exists (to avoid errors on re-run)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_pair' 
        AND conrelid = 'chat_matches'::regclass
    ) THEN
        ALTER TABLE chat_matches DROP CONSTRAINT unique_pair;
    END IF;
END $$;

-- Add the unique constraint
ALTER TABLE chat_matches
ADD CONSTRAINT unique_pair UNIQUE (user1_id, user2_id);

