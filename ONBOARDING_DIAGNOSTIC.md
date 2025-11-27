# Onboarding Completion Diagnostic

## Problem
Users are completing onboarding but being redirected back to the email step. Logs show:
- `[VibePage] Onboarding incomplete, redirecting to: "email"`
- `[OnboardingPage] Onboarding incomplete, allowing access. Step: "email"`

## Root Causes (Possible)
1. **API Save Failure**: The completion save is failing silently
2. **Database Propagation Delay**: Save succeeds but read returns stale data (especially on mobile)
3. **Schema Cache Issue**: `onboarding_completed` column not recognized
4. **Service Role Key**: Wrong or missing `SUPABASE_SERVICE_ROLE_KEY` in Vercel

## Diagnostic Tools Added

### 1. Enhanced Logging
All onboarding completion steps now log detailed information:

**OnboardingController:**
- `[OnboardingController] Saving completion to database...` - Shows what's being saved
- `[OnboardingController] ✅ Completion saved successfully` - Save succeeded
- `[OnboardingController] ❌ Save completion FAILED` - Save failed (with error details)
- `[OnboardingController] ✅ Save verified (attempt X/5)` - Verification succeeded
- `[OnboardingController] ⚠️ Verification attempt X/5 - step is: ...` - Verification retry

**API Route (`/api/users` PUT):**
- `[Users API PUT] Saving onboarding progress:` - Request received
- `[Users API PUT] ✅ Save successful:` - Save succeeded (with saved values)
- `[Users API PUT] ❌ Save failed:` - Save failed (with error)

**saveOnboardingProgress:**
- `[saveOnboardingProgress] Saving to database:` - What's being saved
- `[saveOnboardingProgress] ❌ Upsert error:` - Database error details

**checkOnboardingStatus:**
- `[checkOnboardingStatus] User record found:` - Record retrieved
- `[checkOnboardingStatus] Final result:` - Final status determination

### 2. Diagnostic API Endpoint
New endpoint: `/api/diagnostic?userId=YOUR_USER_ID`

**Usage:**
```javascript
// In browser console after completing onboarding:
const userId = 'YOUR_USER_ID' // Get from user.id
fetch(`/api/diagnostic?userId=${userId}`)
  .then(r => r.json())
  .then(data => console.log('Diagnostics:', data.diagnostics))
```

**What it checks:**
- ✅ Environment variables (Supabase URL, anon key, service role key)
- ✅ Can create Supabase client
- ✅ Can query database
- ✅ Can use auth.admin API (requires service_role key)
- ✅ Current user record state (onboarding_step, onboarding_completed, etc.)

### 3. Improved Completion Flow

**Changes:**
1. **localStorage Flag Set Earlier**: Flag is set immediately after save (not after verification)
2. **Retry Verification**: 5 attempts with 500ms delays (for mobile networks)
3. **Longer Wait Time**: 1 second delay after save (increased from 500ms)
4. **Better Error Handling**: Even if save fails, localStorage flag is set to allow user to proceed

## How to Diagnose

### Step 1: Check Browser Console
After completing onboarding, look for these logs in order:

1. `[OnboardingController] Saving completion to database...`
2. `[Users API PUT] Saving onboarding progress:`
3. `[saveOnboardingProgress] Saving to database:`
4. Either:
   - `[Users API PUT] ✅ Save successful:` ✅
   - `[Users API PUT] ❌ Save failed:` ❌
5. `[OnboardingController] ✅ Completion saved successfully` or `❌ Save completion FAILED`
6. `[OnboardingController] ✅ Save verified (attempt X/5)` or `⚠️ Verification attempt X/5`

### Step 2: Run Diagnostic API
```javascript
// In browser console:
const userId = 'YOUR_USER_ID' // Replace with actual user ID
fetch(`/api/diagnostic?userId=${userId}`)
  .then(r => r.json())
  .then(data => {
    console.log('=== DIAGNOSTIC RESULTS ===')
    console.log('Environment:', data.diagnostics.environment)
    console.log('Supabase Client:', data.diagnostics.supabaseClient)
    console.log('Database:', data.diagnostics.database)
    console.log('Auth Admin:', data.diagnostics.auth)
    console.log('User Record:', data.diagnostics.userRecord)
  })
```

**What to look for:**
- `hasServiceRoleKey: true` - Service role key is set
- `canUseAdmin: true` - Auth admin API works (requires service_role key)
- `canQuery: true` - Database queries work
- `userRecord.onboarding_step: "complete"` - Step is saved correctly
- `userRecord.onboarding_completed: true` - Completion flag is set

### Step 3: Check Vercel Server Logs
1. Go to Vercel Dashboard → Your Project → Functions → View Logs
2. Filter for `/api/users` PUT requests
3. Look for:
   - `[Users API PUT] ✅ Save successful:` - Success
   - `[Users API PUT] ❌ Save failed:` - Failure (with error details)
   - `[saveOnboardingProgress] ❌ Upsert error:` - Database error

### Step 4: Verify Environment Variables
In Vercel Dashboard → Settings → Environment Variables, verify:
- `SUPABASE_SERVICE_ROLE_KEY` is set (NOT the same as anon key)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- `NEXT_PUBLIC_SUPABASE_URL` is set

**Important**: The service_role key and anon key MUST be different!

## Common Issues & Fixes

### Issue 1: "Save completion FAILED"
**Cause**: API save is failing
**Check**: Vercel server logs for error details
**Fix**: 
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check database connection
- Verify migration `025_ensure_onboarding_completed.sql` has been run

### Issue 2: "Save verified - step is: email" (not 'complete')
**Cause**: Save succeeded but wrong step was saved, or read is getting stale data
**Check**: Diagnostic API to see actual database state
**Fix**: 
- Wait longer (mobile networks are slower)
- Check if `onboarding_completed` column exists in database
- Run migration `025_ensure_onboarding_completed.sql`

### Issue 3: "Could not verify save after 5 attempts"
**Cause**: Database read is failing or returning stale data
**Check**: Diagnostic API to see if database queries work
**Fix**:
- Check Vercel server logs for database errors
- Verify database connection
- Check if user record exists

### Issue 4: "API error checking onboarding"
**Cause**: `/api/users` GET endpoint is failing
**Check**: Browser console for network errors
**Fix**:
- Check Vercel server logs
- Verify environment variables
- Check database connection

## Next Steps

1. **Deploy these changes** to get enhanced logging
2. **Complete onboarding** and check browser console logs
3. **Run diagnostic API** to verify database state
4. **Check Vercel logs** for server-side errors
5. **Share the logs** if issue persists

## Files Changed

- `app/api/diagnostic/route.ts` - New diagnostic endpoint
- `components/onboarding/OnboardingController.tsx` - Enhanced logging and retry logic
- `app/api/users/route.ts` - Enhanced logging in PUT handler and saveOnboardingProgress
- `lib/user-helpers.ts` - Enhanced logging in checkOnboardingStatus
