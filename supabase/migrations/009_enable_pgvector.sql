-- Enable pgvector extension for vector similarity search
-- This extension allows us to store and query OpenAI embeddings efficiently

CREATE EXTENSION IF NOT EXISTS vector;

-- Verify extension is installed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
    ) THEN
        RAISE EXCEPTION 'pgvector extension could not be enabled. Please enable it in your Supabase dashboard: Settings → Database → Extensions';
    END IF;
END $$;

-- Note: If this fails, enable pgvector manually in Supabase Dashboard:
-- 1. Go to Settings → Database → Extensions
-- 2. Search for "vector"
-- 3. Click "Enable"
