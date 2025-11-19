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

// Server-side Supabase client (uses service role key - only use in API routes)
export const createServerClient = () => {
  const supabaseUrl = getSupabaseUrl()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
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

