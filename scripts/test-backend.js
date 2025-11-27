/**
 * Backend Connection Diagnostic Script
 * Run with: node scripts/test-backend.js
 * 
 * This script tests if the backend can connect to Supabase
 */

// Check if we're in a Node.js environment
if (typeof process === 'undefined') {
  console.error('❌ This script must be run in Node.js')
  process.exit(1)
}

console.log('🔍 Running Backend Connection Diagnostic...\n')

// Check environment variables
const envVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
}

console.log('📋 Environment Variables Check:')
let envVarsOk = true
for (const [key, value] of Object.entries(envVars)) {
  if (value) {
    const length = value.length
    const masked = value.substring(0, 10) + '...' + value.substring(value.length - 10)
    console.log(`  ✅ ${key}: Set (length: ${length})`)
    if (key.includes('KEY') && length < 100) {
      console.log(`     ⚠️  Warning: Key seems too short (should be > 100 chars)`)
      envVarsOk = false
    }
  } else {
    console.log(`  ❌ ${key}: MISSING`)
    envVarsOk = false
  }
}

if (!envVarsOk) {
  console.log('\n❌ Some environment variables are missing or invalid!')
  console.log('   Please check your .env.local file or Vercel environment variables.')
  process.exit(1)
}

// Check if keys are different
if (envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY === envVars.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('\n⚠️  WARNING: Anon key and Service role key are the SAME!')
  console.log('   This will cause auth.admin API calls to fail.')
  console.log('   Please use different keys from Supabase dashboard.')
}

// Validate URL format
if (envVars.NEXT_PUBLIC_SUPABASE_URL) {
  if (!envVars.NEXT_PUBLIC_SUPABASE_URL.startsWith('http://') && 
      !envVars.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://')) {
    console.log('\n❌ Invalid SUPABASE_URL format (must start with http:// or https://)')
    process.exit(1)
  }
  if (!envVars.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')) {
    console.log('\n⚠️  Warning: SUPABASE_URL doesn\'t look like a Supabase URL')
  }
}

console.log('\n✅ Environment variables check passed!')
console.log('\n📡 To test actual database connection, use the diagnostic endpoint:')
console.log('   1. Start your dev server: npm run dev')
console.log('   2. Open browser console')
console.log('   3. Run: fetch("/api/diagnostic?userId=YOUR_USER_ID").then(r => r.json()).then(console.log)')
console.log('\n💡 Or visit: http://localhost:3000/api/diagnostic?userId=YOUR_USER_ID')

