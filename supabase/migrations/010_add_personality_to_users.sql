-- Add personality-related columns to users table
-- These columns store AI-generated personality profiles and embeddings

-- Add personality_embedding column (vector for OpenAI text-embedding-3-large: 1536 dimensions)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS personality_embedding vector(1536);

-- Add personality_summary column (AI-generated text description)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS personality_summary TEXT;

-- Add traits column (JSONB for structured personality data: Big Five, communication style, etc.)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS traits JSONB DEFAULT '{}'::jsonb;

-- Add bio column (optional user-provided bio)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create index on personality_embedding for vector similarity searches
-- This enables fast cosine similarity queries using pgvector
CREATE INDEX IF NOT EXISTS idx_users_personality_embedding 
ON users 
USING ivfflat (personality_embedding vector_cosine_ops)
WITH (lists = 100);

-- Create GIN index on traits for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_users_traits 
ON users 
USING GIN (traits);

-- Add comment for documentation
COMMENT ON COLUMN users.personality_embedding IS 'OpenAI embedding vector (1536 dimensions) representing user personality';
COMMENT ON COLUMN users.personality_summary IS 'AI-generated personality description based on questionnaire, interests, and behavior';
COMMENT ON COLUMN users.traits IS 'Structured personality traits (Big Five, communication style, social energy, etc.)';
COMMENT ON COLUMN users.bio IS 'Optional user-provided biography';
