import { createClient } from '@supabase/supabase-js'

// Lazy getters - only check env vars when actually needed (not at build time)
const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL in your .env.local file or Vercel environment variables')
    // Only throw at runtime, not during build
    if (typeof window !== 'undefined' || process.env.NODE_ENV === 'production') {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please check your environment configuration.')
    }
    // Return empty string during build to allow compilation
    return ''
  }
  
  // Validate URL format
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    console.error('❌ Invalid NEXT_PUBLIC_SUPABASE_URL format. Must start with http:// or https://')
    throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL format')
  }
  
  return url
}

const getSupabaseAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
    console.error('Please set NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file or Vercel environment variables')
    // Only throw at runtime, not during build
    if (typeof window !== 'undefined' || process.env.NODE_ENV === 'production') {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Please check your environment configuration.')
    }
    // Return empty string during build to allow compilation
    return ''
  }
  
  // Validate key format (Supabase anon keys are JWT tokens, should be long strings)
  if (key.length < 100) {
    console.warn('⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY seems too short. Please verify it is correct.')
  }
  
  return key
}

// Client-side Supabase client (uses anon key)
// Will throw at runtime if env vars are missing, but allows build to succeed
let supabaseUrl: string
let supabaseAnonKey: string

try {
  supabaseUrl = getSupabaseUrl()
  supabaseAnonKey = getSupabaseAnonKey()
} catch (error) {
  // During build, allow empty strings
  supabaseUrl = ''
  supabaseAnonKey = ''
}

// Create client - if env vars are missing, this will fail at runtime with a clear error
// During build, empty strings are allowed to prevent build failures
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)

// Add runtime validation for client-side usage
if (typeof window !== 'undefined') {
  // Validate that we have real credentials (not placeholders)
  if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co') {
    // Test the client by checking if we can make a simple request
    supabase.auth.getSession().catch((error) => {
      if (error.message?.includes('Invalid API key') || error.message?.includes('JWT')) {
        console.error('❌ Supabase API key validation failed. Please check your NEXT_PUBLIC_SUPABASE_ANON_KEY')
        console.error('Error details:', error.message)
      }
    })
  } else {
    console.error('❌ Supabase client initialized with placeholder credentials')
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables')
  }
}

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

