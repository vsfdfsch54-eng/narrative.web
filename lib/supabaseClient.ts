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
const supabaseUrl = getSupabaseUrl()
const supabaseAnonKey = getSupabaseAnonKey()

// Create client with proper error handling
// If env vars are missing during build, use placeholders to allow compilation
// At runtime, the getters will throw clear errors if vars are missing
export const supabase = createClient(
  supabaseUrl || (typeof window === 'undefined' ? 'https://placeholder.supabase.co' : ''),
  supabaseAnonKey || (typeof window === 'undefined' ? 'placeholder-key' : ''),
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)

// Runtime validation for client-side usage
if (typeof window !== 'undefined') {
  // Check if we have valid credentials
  const hasValidUrl = supabaseUrl && supabaseUrl.startsWith('http')
  const hasValidKey = supabaseAnonKey && supabaseAnonKey.length > 50
  
  if (!hasValidUrl || !hasValidKey) {
    console.error('❌ Supabase environment variables are missing or invalid!')
    console.error('Required variables:')
    console.error('  - NEXT_PUBLIC_SUPABASE_URL:', hasValidUrl ? '✅ Set' : '❌ Missing')
    console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY:', hasValidKey ? '✅ Set' : '❌ Missing')
    console.error('')
    console.error('Please add these to your .env.local file or Vercel environment variables.')
    console.error('Get your keys from: https://app.supabase.com → Your Project → Settings → API')
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

