# ONBOARDING DIAGNOSTIC REPORT
## Why `onboarding_step` Stays at "email" and Vibe Page Redirects

---

## 🔍 STEP 1: GLOBAL SCAN RESULTS

### Files That Set `onboarding_step`

#### 1. **`app/api/users/route.ts` - GET Handler (Line 221)**
**CRITICAL FINDING: Auto-creates users with `onboarding_step: 'email'`**
```typescript
// Line 214-221
const { data: upsertResult, error: createError } = await supabase
  .from('users')
  .upsert({
    id: userId,
    email: userEmail,
    name: safeUserName,
    interests: [],
    onboarding_step: 'email', // ⚠️ ALWAYS SETS TO 'email' WHEN CREATING
  }, {
    onConflict: 'id', // ⚠️ THIS MEANS IT CAN OVERWRITE EXISTING USERS
    ignoreDuplicates: false
  })
```

**Problem**: If `GET /api/users` is called after completion but before the database has the updated record, it might:
- Find no existing user (race condition)
- Auto-create a NEW user record with `onboarding_step: 'email'`
- **OVERWRITE** the completed onboarding status

**When this happens**:
- User completes onboarding → PUT saves `onboarding_step: 'complete'`
- User navigates to `/vibe` → VibePage calls `checkOnboardingStatus(user.id)`
- `checkOnboardingStatus` calls `getAppUserRecord(user.id)` → calls `GET /api/users?userId=...`
- If database hasn't propagated yet, GET handler doesn't find user
- GET handler auto-creates user with `onboarding_step: 'email'` ← **OVERWRITES COMPLETION**

#### 2. **`app/api/users/route.ts` - PUT Handler / `saveOnboardingProgress` (Line 467-469)**
**Sets `onboarding_step` from request body:**
```typescript
// Line 467-469
if (data.onboarding_step !== undefined) {
  updateData.onboarding_step = data.onboarding_step
}
```
**Status**: ✅ Correct - only sets if provided

#### 3. **`components/onboarding/OnboardingController.tsx` - Completion Handler (Line 260)**
**Sets `onboarding_step: 'complete'` on completion:**
```typescript
// Line 260
onboarding_step: 'complete',
onboarding_completed: true,
```
**Status**: ✅ Correct

#### 4. **`lib/onboarding.ts` - `normalizeOnboardingStep()` (Line 98-107)**
**Converts null/undefined/'start' to 'email':**
```typescript
export function normalizeOnboardingStep(step: string | null | undefined): OnboardingStep {
  if (!step || !isValidOnboardingStep(step)) {
    return 'email'  // ⚠️ Returns 'email' for null/undefined
  }
  if (step === 'start') {
    return 'email'  // ⚠️ Converts 'start' to 'email'
  }
  return step
}
```
**Status**: ⚠️ **This is the fallback that causes the issue**

**When this triggers**:
- `checkOnboardingStatus` calls `getAppUserRecord(userId)`
- If `getAppUserRecord` returns `null` (API failure, timeout, etc.)
- `checkOnboardingStatus` calls `normalizeOnboardingStep(null)` → returns `'email'`
- VibePage sees `step: 'email'` → redirects to onboarding

#### 5. **`supabase/migrations/022_add_onboarding_step.sql` (Line 13)**
**Database default:**
```sql
ADD COLUMN onboarding_step TEXT DEFAULT 'start' NOT NULL;
```
**Status**: ⚠️ Database default is `'start'`, but code expects `'email'`

---

### Files That Create/Upsert Users

#### 1. **`app/api/users/route.ts` - GET Handler (Line 214-226)**
**Auto-creates user if missing:**
- **Location**: Lines 209-226
- **Trigger**: When `GET /api/users?userId=...` is called and user doesn't exist
- **Sets**: `onboarding_step: 'email'` (Line 221)
- **Uses**: `upsert` with `onConflict: 'id'` (Line 223)
- **Problem**: Can overwrite existing user if called during race condition

#### 2. **`app/api/users/route.ts` - PUT Handler / `saveOnboardingProgress` (Line 489-496)**
**Updates user via upsert:**
- **Location**: Lines 489-496
- **Trigger**: When `PUT /api/users` is called
- **Sets**: `onboarding_step` from request body (Line 467-469)
- **Uses**: `upsert` with `onConflict: 'id'` (Line 492-495)
- **Status**: ✅ Correct - only updates if provided

---

### Files That Check `first_name` / `last_name`

#### 1. **`app/api/users/route.ts` - `saveOnboardingProgress` (Line 452-457)**
**Sets first_name and last_name:**
```typescript
// Line 452-457
if (data.firstName !== undefined) {
  updateData.first_name = data.firstName
}
if (data.lastName !== undefined) {
  updateData.last_name = data.lastName
}
```
**Status**: ✅ Correct - only sets if provided

#### 2. **`context/OnboardingContext.tsx` - Initialize (Line 79-80)**
**Reads first_name and last_name:**
```typescript
// Line 79-80
firstName: dbUser.first_name || '',
lastName: dbUser.last_name || '',
```
**Status**: ✅ Correct

---

### Race Conditions Identified

#### **Race Condition #1: GET /api/users Auto-Creation**
**Scenario**:
1. User completes onboarding → `PUT /api/users` saves `onboarding_step: 'complete'`
2. Database write is in progress (not yet committed)
3. User navigates to `/vibe` → VibePage calls `checkOnboardingStatus(user.id)`
4. `checkOnboardingStatus` calls `getAppUserRecord(user.id)` → `GET /api/users?userId=...`
5. GET handler queries database → **User not found** (write not committed yet)
6. GET handler auto-creates user with `onboarding_step: 'email'` ← **OVERWRITES COMPLETION**

**Evidence**:
- Line 90-94: GET handler checks if user exists
- Line 109: If `!existingUser`, it creates a new user
- Line 221: New user is created with `onboarding_step: 'email'`
- Line 223: Uses `onConflict: 'id'` which can overwrite existing records

#### **Race Condition #2: API Failure → normalizeOnboardingStep(null)**
**Scenario**:
1. User completes onboarding → `PUT /api/users` saves `onboarding_step: 'complete'`
2. User navigates to `/vibe` → VibePage calls `checkOnboardingStatus(user.id)`
3. `getAppUserRecord(user.id)` fails (timeout, network error, 500 error)
4. `getAppUserRecord` returns `null`
5. `checkOnboardingStatus` calls `normalizeOnboardingStep(null)` → returns `'email'`
6. VibePage sees `step: 'email'` → redirects to onboarding

**Evidence**:
- `lib/user-helpers.ts` Line 128: Returns `step: normalizeOnboardingStep(null)` when record is null
- `lib/onboarding.ts` Line 100: `normalizeOnboardingStep(null)` returns `'email'`

---

## 🎯 STEP 2: MOST LIKELY CAUSES

### **Cause #1: GET /api/users Auto-Creation Overwrites Completion (HIGHEST PROBABILITY)**

**Why this is the most likely**:
1. The GET handler uses `upsert` with `onConflict: 'id'` (Line 223)
2. If called during a race condition (before PUT completes), it creates a new user
3. New user is created with `onboarding_step: 'email'` (Line 221)
4. This **overwrites** the completed onboarding status

**Evidence from logs**:
- `[VibePage] Onboarding incomplete, redirecting to: "email"` - This happens AFTER completion
- The redirect happens because `checkOnboardingStatus` returns `step: 'email'`
- This suggests the database was overwritten or the read failed

**Fix Required**:
- **DO NOT** auto-create users in GET handler
- **OR** Check if user exists in auth BEFORE creating
- **OR** Use `insert` instead of `upsert` (fail if user exists)
- **OR** Only create if `onboarding_step` is not already set

### **Cause #2: API Failure → normalizeOnboardingStep(null) Returns 'email'**

**Why this is likely**:
1. Mobile networks are slower
2. API calls can timeout (15 second timeout in `getAppUserRecord`)
3. If API fails, `getAppUserRecord` returns `null`
4. `normalizeOnboardingStep(null)` returns `'email'`
5. VibePage redirects to onboarding

**Evidence**:
- User reported: "it works on laptop but not phone"
- Mobile networks are slower → more likely to timeout
- `lib/user-helpers.ts` has circuit breaker (3 errors) but might not catch all cases

**Fix Required**:
- If API fails, don't redirect to onboarding
- Check `apiError` flag before redirecting (already implemented, but might not be working)
- Increase timeout or retry logic

### **Cause #3: Database Write Not Committed Before Read**

**Why this is possible**:
1. User completes onboarding → `PUT /api/users` saves `onboarding_step: 'complete'`
2. Database write is committed but not yet visible to reads (replication lag)
3. `GET /api/users` reads stale data → sees `onboarding_step: 'email'`
4. VibePage redirects to onboarding

**Evidence**:
- Code has 1 second delay after save (Line 310 in OnboardingController)
- Code has 5 retry attempts with 500ms delays (Line 314-340)
- But if database replication is slow, reads might still be stale

**Fix Required**:
- Wait longer after save
- More retries
- Use database transaction to ensure consistency

---

## 📋 STEP 3: PROPOSED FIX PLAN

### **Fix #1: Prevent GET /api/users from Overwriting Completion (CRITICAL)**

**File**: `app/api/users/route.ts` (GET handler)

**Current Code (Lines 209-226)**:
```typescript
} else {
  // No user with this email exists - safe to create new user
  const safeUserName = userName || userEmail?.split('@')[0] || 'User'
  
  const { data: upsertResult, error: createError } = await supabase
    .from('users')
    .upsert({
      id: userId,
      email: userEmail,
      name: safeUserName,
      interests: [],
      onboarding_step: 'email', // ⚠️ PROBLEM: Always sets to 'email'
    }, {
      onConflict: 'id', // ⚠️ PROBLEM: Can overwrite existing user
      ignoreDuplicates: false
    })
```

**Proposed Fix**:
```typescript
} else {
  // No user with this email exists - BUT check if user exists by ID first
  // This prevents race conditions where user was just created
  const { data: existingById, error: idCheckError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  
  if (existingById) {
    // User exists by ID - use it (might have been created between our checks)
    userData = existingById
  } else {
    // User truly doesn't exist - safe to create
    const safeUserName = userName || userEmail?.split('@')[0] || 'User'
    
    const { data: upsertResult, error: createError } = await supabase
      .from('users')
      .insert({  // ⚠️ CHANGE: Use insert instead of upsert
        id: userId,
        email: userEmail,
        name: safeUserName,
        interests: [],
        onboarding_step: 'email',
      })
      .select('*')
    
    // Handle duplicate key error (user was created between checks)
    if (createError && (createError.code === '23505' || createError.message.includes('duplicate'))) {
      // User was created - fetch it
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      
      if (existingUser && !fetchError) {
        userData = existingUser
      } else {
        // Return error
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to create user record' 
        }, { status: 500 })
      }
    } else if (createError) {
      // Other error
      return NextResponse.json({ 
        success: false, 
        error: createError.message 
      }, { status: 500 })
    } else if (upsertResult && upsertResult.length > 0) {
      userData = Array.isArray(upsertResult) ? upsertResult[0] : upsertResult
    }
  }
}
```

**Why this fixes it**:
- Checks by ID before creating (prevents race condition)
- Uses `insert` instead of `upsert` (fails if user exists, doesn't overwrite)
- Handles duplicate key error gracefully (fetches existing user)

### **Fix #2: Improve API Error Handling in checkOnboardingStatus**

**File**: `lib/user-helpers.ts`

**Current Code (Lines 127-179)**:
```typescript
if (!record) {
  // ... error handling ...
  return {
    completed: false,
    step: normalizeOnboardingStep(null),  // ⚠️ PROBLEM: Returns 'email'
    record: null,
    apiError: isApiError
  }
}
```

**Proposed Fix**:
```typescript
if (!record) {
  // ... error handling ...
  return {
    completed: false,
    step: normalizeOnboardingStep(null),  // Keep this for UI
    record: null,
    apiError: isApiError
  }
  // ⚠️ NOTE: VibePage already checks apiError before redirecting
  // But we should ensure apiError is set correctly
}
```

**Status**: ✅ Already implemented - VibePage checks `apiError` before redirecting (Line 216-220)

### **Fix #3: Add Database Transaction to Completion Save**

**File**: `components/onboarding/OnboardingController.tsx` (Line 251-264)

**Current Code**: Uses separate PUT request

**Proposed Fix**: 
- Keep current approach (PUT request is fine)
- But add verification that checks database AFTER save
- Already implemented (Lines 314-340) but might need more retries

**Status**: ✅ Already implemented with 5 retries

### **Fix #4: Increase Wait Time After Completion Save**

**File**: `components/onboarding/OnboardingController.tsx` (Line 310)

**Current Code**:
```typescript
await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second
```

**Proposed Fix**:
```typescript
await new Promise(resolve => setTimeout(resolve, 2000)) // 2 seconds for mobile
```

**Why**: Mobile networks and database replication can be slower

---

## 🔧 FILES THAT MUST BE EDITED

1. **`app/api/users/route.ts`** (GET handler, Lines 209-226)
   - **Change**: Prevent auto-creation from overwriting existing users
   - **Method**: Check by ID before creating, use `insert` instead of `upsert`

2. **`components/onboarding/OnboardingController.tsx`** (Line 310)
   - **Change**: Increase wait time after save from 1s to 2s
   - **Method**: Change `setTimeout(resolve, 1000)` to `setTimeout(resolve, 2000)`

---

## 🚫 OLD CODE TO REMOVE

**None** - No code needs to be removed, only modified

---

## ⚠️ RACE CONDITIONS TO ADDRESS

1. **GET /api/users auto-creation race condition** (Fix #1)
2. **Database replication lag** (Fix #4 - increase wait time)

---

## ✅ DB UPDATES TO CONFIRM

1. **Completion save is actually working**:
   - Check Vercel logs for `[Users API PUT] ✅ Save successful:`
   - Verify `onboarding_step: 'complete'` is in the saved data

2. **GET /api/users is not overwriting**:
   - Check Vercel logs for `[Users API GET]` requests after completion
   - Verify no new user creation after completion

3. **Database has correct data**:
   - Run: `SELECT id, email, onboarding_step, onboarding_completed FROM users WHERE id = 'USER_ID'`
   - Verify `onboarding_step = 'complete'` and `onboarding_completed = true`

---

## 📊 SUMMARY

**Most Likely Root Cause**: GET /api/users auto-creation is overwriting completed onboarding status during race condition.

**Fix Priority**:
1. **CRITICAL**: Fix GET /api/users auto-creation (Fix #1)
2. **HIGH**: Increase wait time after save (Fix #4)
3. **MEDIUM**: Verify API error handling is working (already implemented)

**Expected Outcome**: After fixes, completion save will not be overwritten, and users will stay on `/vibe` after completing onboarding.
