-- Add last_active timestamp to waiting_pool for active user matching
-- This ensures we only match users who are actively on the site

ALTER TABLE waiting_pool 
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for efficient queries on active users
CREATE INDEX IF NOT EXISTS idx_waiting_pool_last_active ON waiting_pool(last_active);

-- Update existing entries to have last_active = created_at
UPDATE waiting_pool 
SET last_active = created_at 
WHERE last_active IS NULL;

