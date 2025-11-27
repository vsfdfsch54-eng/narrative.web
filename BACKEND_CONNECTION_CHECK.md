# Backend Connection Check

## Quick Test

You can test your backend connection using the diagnostic endpoint:

**In browser console (after logging in):**
```javascript
// Get your user ID first
const userId = 'YOUR_USER_ID' // Replace with actual user.id

// Test backend connection
fetch(`/api/diagnostic?userId=${userId}`)
  .then(r => r.json())
  .then(data => {
    console.log('=== BACKEND CONNECTION STATUS ===')
    console.log('Environment:', data.diagnostics.environment)
    console.log('Supabase Client:', data.diagnostics.supabaseClient)
    console.log('Database:', data.diagnostics.database)
    console.log('Auth Admin:', data.diagnostics.auth)
    console.log('User Record:', data.diagnostics.userRecord)
  })
```

## Required Environment Variables

### For Local Development (.env.local):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### For Vercel (Production):
Set these in Vercel Dashboard → Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Backend Components Status

### ✅ API Routes (21 endpoints)
- `/api/users` - User management (GET, PUT)
- `/api/diagnostic` - Connection diagnostics
- `/api/topics` - Topics fetching
- `/api/connect` - Matchmaking connection
- `/api/connect/status` - Connection status
- `/api/personality/generate` - Personality generation
- `/api/matchmaking/process` - Matchmaking processing
- `/api/matches` - Chat matches
- `/api/messages` - Messages
- `/api/chats` - Chat list
- `/api/vibes` - Vibe selection
- `/api/calendar` - Calendar events
- `/api/feedback` - Feedback submission
- `/api/relationships` - User relationships
- `/api/notifications` - Notifications
- `/api/presence` - User presence
- `/api/typing` - Typing indicators
- `/api/files/upload` - File uploads
- `/api/messages/reactions` - Message reactions
- `/api/messages/mark-read` - Mark messages as read
- `/api/migrate/personality` - Personality migration

### ✅ Supabase Client Configuration
- **Client-side**: `lib/supabaseClient.ts` - Uses anon key
- **Server-side**: `createServerClient()` - Uses service role key
- **Error handling**: Validates env vars at runtime

### ✅ Database Tables (from migrations)
- `users` - User profiles and onboarding
- `topics` - Conversation topics
- `chat_matches` - Matched pairs
- `messages` - Chat messages
- `calendar_events` - User calendar
- `feedback` - User feedback
- `waiting_pool` - Matchmaking queue
- `relationships` - User connections
- `notifications` - User notifications

## Connection Checklist

### 1. Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set
- [ ] Keys are different (anon ≠ service_role)

### 2. Supabase Client
- [ ] Client-side client can be created
- [ ] Server-side client can be created
- [ ] No errors in browser console about missing env vars

### 3. Database Connection
- [ ] Can query `users` table
- [ ] Can query other tables
- [ ] No RLS policy errors

### 4. Auth Admin API
- [ ] Can use `supabase.auth.admin.getUserById()`
- [ ] Service role key is working
- [ ] No timeout errors

### 5. API Routes
- [ ] `/api/users` GET works
- [ ] `/api/users` PUT works
- [ ] `/api/topics` works
- [ ] Other routes respond (not 500 errors)

## How to Verify

### Step 1: Check Environment Variables
Run the diagnostic endpoint (see Quick Test above) and check:
- `environment.hasSupabaseUrl` should be `true`
- `environment.hasAnonKey` should be `true`
- `environment.hasServiceRoleKey` should be `true`
- `serviceRoleKeyLength` should be > 100 (JWT tokens are long)
- `anonKeyLength` should be > 100

### Step 2: Check Supabase Client
- `supabaseClient.canCreate` should be `true`
- `supabaseClient.error` should be `null`

### Step 3: Check Database
- `database.canQuery` should be `true`
- `database.error` should be `null`

### Step 4: Check Auth Admin
- `auth.canUseAdmin` should be `true`
- `auth.error` should be `null`

### Step 5: Check User Record
- `userRecord` should show your user data (if userId provided)
- Should have `onboarding_step`, `email`, `name`, etc.

## Common Issues

### Issue: "Missing environment variable"
**Fix**: Set the variable in `.env.local` (local) or Vercel (production)

### Issue: "Cannot use auth.admin"
**Fix**: Check that `SUPABASE_SERVICE_ROLE_KEY` is set and different from anon key

### Issue: "Database query failed"
**Fix**: Check Supabase project is active, RLS policies are correct

### Issue: "Service role key too short"
**Fix**: Make sure you copied the full key from Supabase dashboard

## Next Steps

1. Run the diagnostic endpoint
2. Check all status indicators are `true`
3. If any are `false`, check the error messages
4. Verify environment variables are set correctly
5. Test a real API call (e.g., complete onboarding)

