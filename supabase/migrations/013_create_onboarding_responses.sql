-- Create onboarding_responses table to store personality questionnaire answers
-- This data is used to generate AI personality profiles

CREATE TABLE IF NOT EXISTS onboarding_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb, -- All questionnaire answers
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint: one response set per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_onboarding_responses_user_id 
ON onboarding_responses (user_id);

-- Create GIN index on responses for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_onboarding_responses_responses 
ON onboarding_responses 
USING GIN (responses);

-- Create index on created_at for analytics
CREATE INDEX IF NOT EXISTS idx_onboarding_responses_created_at 
ON onboarding_responses (created_at);

-- Enable Row Level Security
ALTER TABLE onboarding_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own responses
CREATE POLICY "Users can read their own responses" ON onboarding_responses
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own responses
CREATE POLICY "Users can insert their own responses" ON onboarding_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own responses
CREATE POLICY "Users can update their own responses" ON onboarding_responses
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role can read all (for AI processing)
CREATE POLICY "Service role can read all responses" ON onboarding_responses
  FOR SELECT USING (true);

-- Add comment for documentation
COMMENT ON TABLE onboarding_responses IS 'Stores personality questionnaire answers used to generate AI personality profiles';
COMMENT ON COLUMN onboarding_responses.responses IS 'JSON object containing all questionnaire answers (communication style, social energy, values, etc.)';
