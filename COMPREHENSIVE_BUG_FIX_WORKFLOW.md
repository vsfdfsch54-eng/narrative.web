# Comprehensive Bug Fix Workflow for Narrative App

## Overview
This document provides a systematic workflow to debug and fix all critical bugs in the Narrative app. Follow each section step-by-step.

---

## BUG #1: EMAIL LOOP / STEP RESET

### Symptoms
- User completes email step → navigates to password
- On refresh, user redirected back to email step
- Database shows `onboarding_step: "email"` even after progression

### Step 1: Add Diagnostic Logging ✅ (COMPLETED)
**Files Modified:**
- `app/api/users/route.ts` - Added logging to GET handler
- `context/OnboardingContext.tsx` - Added logging to initialize()
- `components/onboarding/OnboardingController.tsx` - Added logging to step handlers
- `app/onboarding/page.tsx` - Added logging to step comparison

**What to Look For:**
1. Open browser console and DevTools Network tab
2. Go through onboarding flow (email → password → name)
3. Watch for these log patterns:
   - `[Users API GET] ✅ Existing record returned` - Check if `onboarding_step` is "email" when it should be "password" or "name"
   - `[saveOnboardingProgress] 📥 INCOMING SAVE REQUEST` - Check if step is being saved correctly
   - `[saveOnboardingProgress] ✅ AFTER UPSERT` - Check if saved step matches expected step
   - `[OnboardingContext] 📥 INITIALIZE` - Check if DB step is resetting to "email"

### Step 2: Check Database Directly
**Action:**
1. Open Supabase Dashboard → SQL Editor
2. Run this query (replace `USER_ID` with actual user ID):
```sql
SELECT 
  id,
  email,
  onboarding_step,
  onboarding_completed,
  first_name,
  last_name,
  updated_at
FROM users
WHERE id = 'USER_ID'
ORDER BY updated_at DESC;
```

**What to Look For:**
- Does `onboarding_step` change from "password" → "email"?
- Does `updated_at` timestamp show recent updates?
- Are there multiple rows for the same user?

### Step 3: Check GET /api/users Handler
**File:** `app/api/users/route.ts` (lines 105-170)

**Potential Issues:**
1. **User creation overwriting existing user** (line 329)
   - Check if `INSERT` is being called when user already exists
   - Look for: `[Users API GET] 🔍 CREATING NEW USER` logs when user should exist

2. **Existing user check not working** (line 151)
   - Verify the guard `if (existingUser)` is working
   - Check logs: `[Users API GET] ✅ Existing record returned`

**Fix if needed:**
```typescript
// Ensure this guard is at the TOP and returns immediately
if (existingUser) {
  console.log('[Users API GET] ✅ Existing record returned:', {
    userId,
    onboarding_step: existingUser.onboarding_step, // Should NOT be "email" if user progressed
    // ...
  })
  return NextResponse.json({ success: true, data: existingUser })
  // CRITICAL: Return immediately, don't run creation logic
}
```

### Step 4: Check saveOnboardingProgress Function
**File:** `app/api/users/route.ts` (lines 492-800)

**Potential Issues:**
1. **Step not being saved** - Check logs: `[saveOnboardingProgress] 💾 BEFORE UPSERT`
2. **Upsert overwriting with default** - Check if `updateData.onboarding_step` is undefined
3. **Verification failing** - Check logs: `[saveOnboardingProgress] ✅ AFTER UPSERT`

**Fix if needed:**
```typescript
// Ensure step is ALWAYS set in updateData
if (stepToSave !== undefined) {
  updateData.onboarding_step = stepToSave
} else if (existingUser?.onboarding_step) {
  // Preserve existing step if not provided
  updateData.onboarding_step = existingUser.onboarding_step
} else {
  // Only default to 'email' if truly new user
  updateData.onboarding_step = 'email'
}
```

### Step 5: Check Client-Side State Management
**Files:**
- `context/OnboardingContext.tsx` (lines 95-127)
- `components/onboarding/OnboardingController.tsx` (lines 94-131)

**Potential Issues:**
1. **Context resetting to 'email'** - Check logs: `[OnboardingContext] 📥 INITIALIZE`
2. **URL step overriding client step** - Check logs: `[OnboardingController] ⚠️ URL says "email"`

**Fix if needed:**
```typescript
// In OnboardingContext.initialize()
if (dbStep === 'email' && prev.step !== 'email' && prev.step !== 'start') {
  // CRITICAL: Preserve client step if DB is stale
  finalStep = prev.step
}
```

### Step 6: Verify Fix
**Test Steps:**
1. Start fresh onboarding flow
2. Complete email step → check console logs
3. Complete password step → check console logs
4. Refresh page → should stay on password step (not reset to email)
5. Check database directly → `onboarding_step` should be "password" or "name"

**Success Criteria:**
- ✅ No redirect to email step after refresh
- ✅ Database shows correct step after each save
- ✅ Console logs show step progression correctly

---

## BUG #2: DATA NOT SAVING DURING ONBOARDING

### Symptoms
- User enters name → shows "Not set" on confirmation
- Database shows `first_name: null`, `last_name: null`
- Interests and questions not persisting

### Step 1: Check saveProgress Function
**File:** `context/OnboardingContext.tsx` (lines 161-231)

**Potential Issues:**
1. **Stale closure** - Values not passed explicitly
2. **user.id not available** - Save queued but never executed
3. **Background save failing silently**

**Check Logs:**
- `[OnboardingContext] Cannot save: user ID is missing` - User ID not available
- `[OnboardingContext] Background save failed` - Save is failing

### Step 2: Verify Explicit Value Passing
**File:** `components/onboarding/OnboardingController.tsx`

**Check these handlers:**
- `handleNameSubmit` (around line 350) - Should pass `firstName` and `lastName` explicitly
- `handleQuestionsSubmit` (around line 450) - Should pass `questionsAnswers` explicitly
- `handleInterestsSubmit` (around line 550) - Should pass `interests` explicitly

**Fix if needed:**
```typescript
// In handleNameSubmit
await saveProgress('name', {
  firstName: state.firstName,
  lastName: state.lastName,
  email: state.email
})

// NOT just:
// await saveProgress('name') // This uses stale state!
```

### Step 3: Check PUT /api/users Handler
**File:** `app/api/users/route.ts` (lines 800-1000)

**Potential Issues:**
1. **Fields not being extracted from body** - Check line 812
2. **Direct update not working** - Check line 891

**Check Logs:**
- `[Users API PUT] ✅ Save successful` - Check if `savedStep`, `savedName` match expected

### Step 4: Verify Retry Logic
**File:** `context/OnboardingContext.tsx` (lines 240-280)

**Check:**
- Is retry logic executing when `user.id` becomes available?
- Are values being passed correctly in retry?

**Fix if needed:**
```typescript
// In retry useEffect
if (user?.id && state.initialized) {
  // Check if we have unsaved data
  const needsSave = state.step !== 'email' && state.step !== 'start'
  
  if (needsSave) {
    saveProgress(state.step, {
      firstName: state.firstName,
      lastName: state.lastName,
      // ... pass all values explicitly
    })
  }
}
```

### Step 5: Verify Fix
**Test Steps:**
1. Enter first name and last name → click Continue
2. Check console: `[OnboardingController] ✅ Name save successful`
3. Check database: `first_name` and `last_name` should be set
4. Complete questions → check database: `questions_answers` should be set
5. Complete interests → check database: `interests` should be set

**Success Criteria:**
- ✅ All data saves to database
- ✅ Confirmation page shows correct data
- ✅ No "Not set" messages

---

## BUG #3: SLOW/UNRESPONSIVE ONBOARDING

### Symptoms
- Continue button doesn't work
- Button stays in loading state
- UI freezes

### Step 1: Check Email Step Handler
**File:** `components/onboarding/steps/EmailStep.tsx`

**Potential Issues:**
1. **Blocking API call** - `handleSubmit` waiting for save
2. **isSubmitting not resetting** - Button stuck in loading state
3. **Navigation hanging** - `router.replace()` not working

**Fix:**
```typescript
// Make handleSubmit non-blocking
const handleSubmit = async (email: string) => {
  if (isSubmitting) return // Prevent double-submit
  
  setIsSubmitting(true)
  
  try {
    // Save in background (non-blocking)
    saveProgress('password', { email }).catch(err => {
      console.error('Background save failed:', err)
    })
    
    // Navigate immediately (don't wait for save)
    navigateToStep('password')
  } finally {
    // Reset after 500ms (safety timeout)
    setTimeout(() => setIsSubmitting(false), 500)
  }
}
```

### Step 2: Check Navigation Fallback
**File:** `components/onboarding/OnboardingController.tsx` (lines 203-219)

**Ensure:**
- `window.location.href` fallback exists
- Fallback triggers after 100ms if router doesn't navigate

**Fix if needed:**
```typescript
const navigateToStep = (step: OnboardingStep) => {
  const route = `/onboarding?step=${step}`
  setStep(step)
  router.replace(route)
  
  // Fallback: if router doesn't navigate within 100ms, use window.location
  setTimeout(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/onboarding') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('step') !== step) {
        window.location.href = route
      }
    }
  }, 100)
}
```

### Step 3: Check saveProgress Non-Blocking
**File:** `context/OnboardingContext.tsx` (lines 161-231)

**Ensure:**
- `saveProgress` returns `true` immediately
- Save happens in `setTimeout` (background)
- No `await` on saveProgress in step handlers

**Fix if needed:**
```typescript
const saveProgress = useCallback(async (...): Promise<boolean> => {
  // Update local state immediately
  if (step) {
    setState(prev => ({ ...prev, step }))
  }
  
  // Save in background (non-blocking)
  setTimeout(async () => {
    // ... save logic
  }, 0)
  
  // Return immediately - never block
  return true
}, [...])
```

### Step 4: Verify Fix
**Test Steps:**
1. Enter email → click Continue
2. Button should respond immediately (< 100ms)
3. Navigation should happen instantly
4. Check console: No blocking errors

**Success Criteria:**
- ✅ Buttons respond instantly
- ✅ Navigation happens immediately
- ✅ No UI freezing

---

## BUG #4: MATCH FEED NOT SHOWING USERS

### Symptoms
- Match page shows "No More Matches"
- Other users are online (visible in Friends Online)
- Console shows RPC error or empty array

### Step 1: Verify RPC Function is Deployed
**Action:**
1. Open Supabase Dashboard → SQL Editor
2. Run this query:
```sql
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'get_online_match_feed';
```

**Expected:**
- Should return 1 row with the function definition

**If Missing:**
- Run migration `035_online_match_feed_rpc.sql` in Supabase SQL Editor

### Step 2: Test RPC Function Directly
**Action:**
1. Get a user ID from your database
2. Run this query in Supabase SQL Editor:
```sql
SELECT * FROM get_online_match_feed('USER_ID_HERE'::UUID);
```

**What to Look For:**
- Does it return users?
- Are they online users?
- Are they excluded correctly?

### Step 3: Check Online User Filtering
**File:** `supabase/migrations/035_online_match_feed_rpc.sql` (lines 70-76)

**Verify:**
- Query checks `is_online = true`
- Query checks `last_seen_at >= NOW() - INTERVAL '5 minutes'`

**Fix if needed:**
```sql
-- In RPC function, ensure this filter is correct:
AND u.id IN (
  SELECT user_id 
  FROM user_presence
  WHERE is_online = true
  AND last_seen_at >= NOW() - INTERVAL '5 minutes'
)
```

### Step 4: Check API Route
**File:** `app/api/match/feed/route.ts`

**Check Logs:**
- `[Match Feed] RPC error` - RPC function failing
- Check response: `data.profiles` should be array

**Fix if needed:**
```typescript
// Add better error logging
const { data, error } = await supabase.rpc('get_online_match_feed', {
  current_user_id: userId,
})

if (error) {
  console.error('[Match Feed] RPC error:', {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
    userId
  })
  // ... return error
}
```

### Step 5: Check Presence System
**Action:**
1. Check if users have presence records:
```sql
SELECT 
  user_id,
  is_online,
  last_seen_at,
  NOW() - last_seen_at AS time_since_seen
FROM user_presence
WHERE is_online = true
ORDER BY last_seen_at DESC;
```

**What to Look For:**
- Are users marked as `is_online = true`?
- Is `last_seen_at` within last 5 minutes?

### Step 6: Verify Fix
**Test Steps:**
1. Ensure 2+ users are online (check `user_presence` table)
2. Navigate to `/match` page
3. Check console: `[Match Feed]` logs
4. Should see users in feed

**Success Criteria:**
- ✅ Feed shows online users
- ✅ No "No More Matches" when users are online
- ✅ RPC function returns correct results

---

## BUG #5: MATCHING WITH INACTIVE USERS

### Symptoms
- Matching with users who are offline
- Users in background tabs appearing in feed

### Step 1: Check Presence Updates
**File:** Check client-side presence updates

**Potential Issues:**
1. **Heartbeat not running** - `last_seen_at` not updating
2. **Tab visibility not tracked** - Background tabs still marked online

**Fix:**
```typescript
// In match page or presence hook
useEffect(() => {
  if (!user?.id) return
  
  // Update presence on mount
  updatePresence(true)
  
  // Heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    if (document.visibilityState === 'visible') {
      updatePresence(true)
    } else {
      // Tab is hidden - mark as offline after 30 seconds
      setTimeout(() => {
        if (document.visibilityState !== 'visible') {
          updatePresence(false)
        }
      }, 30000)
    }
  }, 30000)
  
  // Handle visibility change
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      updatePresence(true)
    } else {
      // Mark offline after 30 seconds if still hidden
      setTimeout(() => {
        if (document.visibilityState !== 'visible') {
          updatePresence(false)
        }
      }, 30000)
    }
  }
  
  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  return () => {
    clearInterval(heartbeat)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    updatePresence(false) // Mark offline on unmount
  }
}, [user?.id])
```

### Step 2: Verify RPC Function Filtering
**File:** `supabase/migrations/035_online_match_feed_rpc.sql` (lines 70-76)

**Ensure:**
- 5-minute window is strict
- No fallback to older users

**Fix if needed:**
```sql
-- Make window stricter (3 minutes instead of 5)
AND last_seen_at >= NOW() - INTERVAL '3 minutes'
```

### Step 3: Check Cleanup Logic
**Action:**
1. Check if stale presence entries are cleaned up
2. Run this query to find stale entries:
```sql
SELECT 
  user_id,
  is_online,
  last_seen_at,
  NOW() - last_seen_at AS time_since_seen
FROM user_presence
WHERE is_online = true
AND last_seen_at < NOW() - INTERVAL '5 minutes';
```

**Fix:**
- Add cleanup job or trigger to mark these as offline

### Step 4: Verify Fix
**Test Steps:**
1. Open app in 2 browser tabs
2. Mark one tab as background (minimize or switch tabs)
3. Wait 30 seconds
4. Check `user_presence` table: background user should be `is_online = false`
5. Check match feed: background user should NOT appear

**Success Criteria:**
- ✅ Only active users appear in feed
- ✅ Background tabs are marked offline
- ✅ Stale entries are cleaned up

---

## BUG #6: ONLY MATCHING WITH ALREADY MATCHED USERS

### Symptoms
- Feed only shows users already matched with
- No new users appear

### Step 1: Check Exclusion Logic
**File:** `supabase/migrations/035_online_match_feed_rpc.sql` (lines 50-68)

**Potential Issues:**
1. **Excluding all users** - Logic too aggressive
2. **Status check wrong** - Checking wrong status values

**Verify:**
```sql
-- Check what users are being excluded
SELECT 
  user_id,
  target_id,
  status
FROM match_queue
WHERE user_id = 'CURRENT_USER_ID'
AND status IN ('pending', 'matched');

-- Check active matches
SELECT 
  user1_id,
  user2_id,
  status
FROM chat_matches
WHERE (user1_id = 'CURRENT_USER_ID' OR user2_id = 'CURRENT_USER_ID')
AND status = 'active';
```

**Fix if needed:**
```sql
-- In RPC function, ensure we only exclude ACTIVE matches
-- Not 'ended' matches
AND u.id NOT IN (
  SELECT 
    CASE 
      WHEN user1_id = current_user_id THEN user2_id
      ELSE user1_id 
    END
  FROM chat_matches
  WHERE (user1_id = current_user_id OR user2_id = current_user_id)
  AND status = 'active' -- Only exclude active, not ended
)
```

### Step 2: Check Match Queue Status
**Action:**
1. Check if old pending connections are blocking:
```sql
SELECT 
  user_id,
  target_id,
  status,
  created_at
FROM match_queue
WHERE user_id = 'CURRENT_USER_ID'
AND status = 'pending'
ORDER BY created_at DESC;
```

**Fix:**
- Clean up old pending connections (older than 24 hours)
- Or only exclude recent pending (last hour)

### Step 3: Verify Fix
**Test Steps:**
1. Create 3+ test users
2. Match user A with user B
3. Check feed for user A: Should see user C (not user B)
4. Check exclusion logs in console

**Success Criteria:**
- ✅ New users appear in feed
- ✅ Already matched users are excluded
- ✅ Old matches don't block new matches

---

## BUG #7: HOME PAGE LAYOUT ISSUES

### Status: ✅ FIXED
- Recent refactor applied clean layout
- Verify on all screen sizes

### Verification Steps:
1. Test on mobile (375px width)
2. Test on tablet (768px width)
3. Test on desktop (1024px+ width)
4. Check horizontal scrolling works
5. Verify sticky CONNECT button

---

## BUG #8: MATCH PAGE UI ISSUES

### Symptoms
- Cards flicker when swiping
- Double-rendering
- UI jitter

### Step 1: Check Card Rendering
**File:** `components/match/CardStack.tsx`

**Potential Issues:**
1. **Multiple cards rendering** - Should only render current card
2. **State updates causing re-renders** - Too many state changes

**Fix:**
```typescript
// Ensure only ONE card renders at a time
const currentProfile = profiles[currentIndex]

return (
  <AnimatePresence mode="wait">
    {currentProfile && (
      <MatchCard
        key={currentProfile.id}
        profile={currentProfile}
        // ...
      />
    )}
  </AnimatePresence>
)
```

### Step 2: Check Feed Refresh Logic
**File:** `app/match/page.tsx` (lines 57-100)

**Ensure:**
- Feed only loads ONCE on mount
- No refresh on every swipe
- Realtime updates don't cause re-renders

**Fix if needed:**
```typescript
// Load feed ONCE
useEffect(() => {
  if (!user?.id || loading) return
  loadMatchFeed()
}, [user?.id]) // Only depend on user.id, not loading

// Don't refresh on card actions
const handleCardAction = async (action, targetId) => {
  // ... action logic
  // Move to next card (no feed refresh)
  const nextIndex = currentCardIndex + 1
  if (nextIndex < feedRef.current.length) {
    setCurrentCardIndex(nextIndex)
  } else {
    // Only refresh if no more cards
    await loadMatchFeed()
  }
}
```

### Step 3: Optimize Animations
**File:** `components/match/MatchCard.tsx`

**Ensure:**
- Animations are smooth
- No layout shifts
- Proper exit animations

**Fix if needed:**
```typescript
<motion.div
  initial={{ opacity: 0, y: 20, scale: 0.95 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, scale: 0.9, y: -20 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
  // ... rest of props
>
```

### Step 4: Verify Fix
**Test Steps:**
1. Navigate to `/match`
2. Swipe through cards
3. Check for flickering/jitter
4. Verify smooth animations

**Success Criteria:**
- ✅ No flickering
- ✅ No double-rendering
- ✅ Smooth animations
- ✅ No UI jitter

---

## EXECUTION ORDER

### Phase 1: Onboarding Bugs (Critical)
1. ✅ Bug #1: Email Loop (Step 1 logging complete)
2. Bug #2: Data Not Saving
3. Bug #3: Slow/Unresponsive

### Phase 2: Matching Bugs (High Priority)
4. Bug #4: Match Feed Empty
5. Bug #5: Matching Inactive Users
6. Bug #6: Only Matching Already Matched

### Phase 3: UI Polish (Medium Priority)
7. Bug #7: Home Page Layout (✅ Fixed, verify)
8. Bug #8: Match Page UI Issues

---

## TESTING CHECKLIST

After fixing each bug, verify:

### Onboarding
- [ ] Can complete onboarding without getting stuck
- [ ] All data saves correctly
- [ ] Step progression is reliable
- [ ] Navigation is smooth
- [ ] No redirect loops

### Matching
- [ ] Only online users appear
- [ ] Feed shows new users
- [ ] Matching is fast
- [ ] Mutual match detection works
- [ ] No inactive users in feed

### UI/UX
- [ ] All pages match design system
- [ ] Layout is clean and consistent
- [ ] No overlapping elements
- [ ] Smooth animations
- [ ] No jitter or lag

---

## QUICK REFERENCE: KEY FILES

### Onboarding
- `app/onboarding/page.tsx` - Page guard
- `components/onboarding/OnboardingController.tsx` - Main controller
- `context/OnboardingContext.tsx` - State management
- `app/api/users/route.ts` - User data API

### Matching
- `app/match/page.tsx` - Match page UI
- `app/api/match/feed/route.ts` - Match feed API
- `supabase/migrations/035_online_match_feed_rpc.sql` - RPC function
- `app/api/match/connect/route.ts` - Connect action

### Presence
- `hooks/use-presence.ts` - Presence hook
- `app/api/presence/route.ts` - Presence API
- `supabase/migrations/016_create_user_presence.sql` - Presence table

---

## NEXT STEPS

1. **Start with Bug #1** - Complete Steps 2-6 (logging is done)
2. **Move to Bug #2** - Fix data saving
3. **Fix Bug #3** - Make onboarding responsive
4. **Then tackle matching bugs** - Bugs #4, #5, #6
5. **Finally polish UI** - Bug #8

**Ready to start?** Let me know which bug you want to tackle first, or if you want me to proceed with Bug #1 Step 2.

