# EMAIL STEP ISSUE DIAGNOSTIC

## Problem
The email entered in the email step is **NOT being saved to the database**.

## Root Cause

### Current Flow (BROKEN):
1. User enters email → `handleEmailSubmit(email)` is called
2. `handleEmailSubmit` only calls:
   - `setEmail(email)` - stores in local state only
   - `navigateToStep('password')` - navigates to password step
3. **❌ `saveProgress()` is NEVER called** - email is never saved to database
4. Email only exists in React state (`state.email`)
5. When password step creates account, it uses `state.email` for signup, but email is never persisted

### Why This Breaks:
- If user refreshes page → email is lost (only in React state)
- If user navigates back → email might be lost
- Email is never in database until account is created (password step)
- But account creation needs the email, so if state is lost, signup fails

## Code Evidence

### `components/onboarding/OnboardingController.tsx` (Line 128-132):
```typescript
const handleEmailSubmit = async (email: string): Promise<void> => {
  setEmail(email)  // ✅ Stores in local state
  // Navigate immediately - non-blocking
  navigateToStep('password')  // ✅ Navigates
  // ❌ MISSING: saveProgress('password', { email })
}
```

### `context/OnboardingContext.tsx` (Line 154):
```typescript
email: email || undefined,  // ✅ saveProgress CAN save email
```
The `saveProgress` function CAN save email, but it's never called from the email step.

## Fix Required

### File: `components/onboarding/OnboardingController.tsx`

**Change `handleEmailSubmit` to save email:**

```typescript
// Email step handler - advance to password step
const handleEmailSubmit = async (email: string): Promise<void> => {
  setEmail(email)
  
  // Save email to database (non-blocking)
  // Even if user isn't logged in yet, this will queue the save
  // and retry when user becomes available after password step
  saveProgress('password', { email }).catch((error) => {
    console.error('[OnboardingController] Save email error:', error)
  })
  
  // Navigate immediately - non-blocking
  navigateToStep('password')
}
```

## Why This Fix Works

1. **Saves email immediately**: Even if user isn't logged in, `saveProgress` will queue the save
2. **Retries when user available**: The `OnboardingContext` has a retry mechanism (Line 187-219) that will save when `user.id` becomes available
3. **Non-blocking**: Uses `setTimeout(0)` so it doesn't block navigation
4. **Persists across refreshes**: Email will be in database, so if user refreshes, it can be loaded from database

## Additional Considerations

The email step should also update `onboarding_step` to `'password'` to track progress, which `saveProgress('password', { email })` will do automatically.

