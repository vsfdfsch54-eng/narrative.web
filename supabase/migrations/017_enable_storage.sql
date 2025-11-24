-- Enable Supabase Storage for file and image uploads
-- Migration 017: File storage setup

-- Note: Storage buckets must be created via Supabase Dashboard or Storage API
-- This migration provides the SQL to create the bucket if needed

-- Create storage bucket for chat files (if it doesn't exist)
-- This will be created via Supabase Dashboard: Storage → Create Bucket
-- Bucket name: 'chat-files'
-- Public: false (private bucket)
-- File size limit: 10MB
-- Allowed MIME types: image/*, application/pdf, etc.

-- Storage policies will be set via Supabase Dashboard or Storage API
-- Policy 1: Users can upload files to their own folder
-- Policy 2: Users can read files from matches they're part of

-- For reference, here's the bucket structure:
-- chat-files/
--   {match_id}/
--     {message_id}/
--       {filename}

-- Add comment for documentation
COMMENT ON SCHEMA public IS 'Storage bucket "chat-files" should be created manually via Supabase Dashboard for file uploads';

