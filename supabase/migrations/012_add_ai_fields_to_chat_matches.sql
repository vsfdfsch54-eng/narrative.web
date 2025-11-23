-- Add AI matching fields to chat_matches table
-- These fields store information about how the AI matched users

-- Add match_score column (AI compatibility score: 0.0 to 1.0)
ALTER TABLE chat_matches
ADD COLUMN IF NOT EXISTS match_score FLOAT;

-- Add traits_used column (JSONB storing which personality traits were used in matching)
ALTER TABLE chat_matches
ADD COLUMN IF NOT EXISTS traits_used JSONB DEFAULT '{}'::jsonb;

-- Create index on match_score for analytics and sorting
CREATE INDEX IF NOT EXISTS idx_chat_matches_match_score 
ON chat_matches (match_score);

-- Create GIN index on traits_used for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_chat_matches_traits_used 
ON chat_matches 
USING GIN (traits_used);

-- Add comments for documentation
COMMENT ON COLUMN chat_matches.match_score IS 'AI-generated compatibility score (0.0 to 1.0) indicating how well users were matched';
COMMENT ON COLUMN chat_matches.traits_used IS 'JSON object storing which personality traits were considered in the matching algorithm';
