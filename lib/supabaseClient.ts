import { createClient } from '@supabase/supabase-js'

// Lazy getters - only check env vars when actually needed (not at build time)
const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    // Only throw at runtime, not during build
    if (typeof window !== 'undefined' || process.env.NODE_ENV === 'production') {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
    }
    // Return empty string during build to allow compilation
    return ''
  }
  return url
}

const getSupabaseAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) {
    // Only throw at runtime, not during build
    if (typeof window !== 'undefined' || process.env.NODE_ENV === 'production') {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
    }
    // Return empty string during build to allow compilation
    return ''
  }
  return key
}

// Client-side Supabase client (uses anon key)
// Will throw at runtime if env vars are missing, but allows build to succeed
export const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseAnonKey()
)

// Server-side Supabase ADMIN client (uses service role key - only use in API routes)
// Service role key bypasses RLS automatically - CRITICAL for matchmaking
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { 
      autoRefreshToken: false, 
      persistSession: false 
    }
  })
}

