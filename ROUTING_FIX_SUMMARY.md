# Routing & Auth Fix Summary

## Overview
Fixed all routing guards and authentication behavior across the Narrative app to ensure consistent, correct redirects based on user authentication and onboarding status.

## Key Changes

### 1. Created Helper Functions

**`lib/user-helpers.ts` (NEW)**
- Created `getAppUserRecord()` function to fetch app-level user record from `/api/users`
- Returns `AppUserRecord` interface with `onboarding_step` and `onboarding_completed` fields
- Handles errors gracefully, returns `null` on failure

**`lib/onboarding.ts` (UPDATED)**
- Updated `normalizeOnboardingStep()` to return `'email'` for `null`/`undefined` values (instead of `'start'`)
- This ensures consistent behavior when onboarding_step is missing

### 2. Fixed All Page Routing Guards

All pages now follow a unified pattern:

1. **Wait for `authLoading === false`** before any redirect logic
2. **Logged-out users** → Redirect to `/` (welcome page)
3. **Logged-in + incomplete onboarding** → Redirect to `/onboarding?step={step}`
4. **Logged-in + complete onboarding** → Allow access or redirect to `/vibe` (for public pages)

#### Pages Fixed:

**`app/page.tsx` (Welcome/Home)**
- Logged-out: Show welcome page
- Logged-in + incomplete: Redirect to `/onboarding?step={step}`
- Logged-in + complete: Redirect to `/vibe` (never show welcome again)

**`app/login/page.tsx`**
- Logged-out: Show login page
- Logged-in + incomplete: Redirect to `/onboarding?step={step}`
- Logged-in + complete: Redirect to `/vibe`

**`app/onboarding/page.tsx`**
- Logged-out: Redirect to `/`
- Logged-in + complete: Redirect to `/vibe`
- Logged-in + incomplete: Allow access (OnboardingController handles step routing)

**`app/vibe/page.tsx`**
- Logged-out: Redirect to `/`
- Logged-in + incomplete: Redirect to `/onboarding?step={step}`
- Logged-in + complete: Render normally

**`app/chat/page.tsx`**
- Logged-out: Redirect to `/`
- Logged-in + incomplete: Redirect to `/onboarding?step={step}`
- Logged-in + complete: Render normally

**`app/profile/page.tsx`**
- Logged-out: Redirect to `/`
- Logged-in + incomplete: Redirect to `/onboarding?step={step}`
- Logged-in + complete: Render normally (FIXED: No longer redirects to `/`)

**`app/calendar/page.tsx`**
- Logged-out: Redirect to `/`
- Logged-in + incomplete: Redirect to `/onboarding?step={step}`
- Logged-in + complete: Render normally

**`app/conversations/page.tsx`**
- Logged-out: Redirect to `/`
- Logged-in + incomplete: Redirect to `/onboarding?step={step}`
- Logged-in + complete: Render normally

### 3. Updated OnboardingController

**`components/onboarding/OnboardingController.tsx`**
- Changed all redirects from `/chat` to `/vibe` when onboarding completes
- Updated `handleConfirmationSubmit()` to redirect to `/vibe`
- Updated completion check to redirect to `/vibe`

## Routing Rules Implemented

### Logged-Out Users
- **Allowed pages**: `/`, `/login`
- **Protected pages** (`/vibe`, `/chat`, `/profile`, `/calendar`, `/conversations`, `/onboarding`): Redirect to `/`

### Logged-In + Incomplete Onboarding
- **Never see**: `/` (welcome), `/login`
- **Always redirect to**: `/onboarding?step={onboarding_step}`
- **Default step**: `'email'` if `onboarding_step` is null/undefined

### Logged-In + Complete Onboarding
- **`/` (welcome)**: Always redirect to `/vibe` (never see welcome again)
- **`/login`**: Redirect to `/vibe`
- **`/onboarding`**: Redirect to `/vibe`
- **Protected pages** (`/vibe`, `/chat`, `/profile`, `/calendar`, `/conversations`): Render normally

## Technical Details

### All Redirects Use `router.replace()`
- Prevents back button from going to stale routes
- Consistent across all pages

### All Pages Wait for Auth Loading
- No redirects happen while `authLoading === true`
- Prevents race conditions and incorrect redirects

### Consistent Error Handling
- All `getAppUserRecord()` calls wrapped in try/catch
- On error, redirect to `/onboarding?step=email` as safe fallback

### TypeScript Safety
- Added null checks for `user` before calling `getAppUserRecord(user.id)`
- All TypeScript errors resolved

## Files Modified

1. `lib/user-helpers.ts` (NEW)
2. `lib/onboarding.ts` (UPDATED)
3. `app/page.tsx` (FIXED)
4. `app/login/page.tsx` (FIXED)
5. `app/onboarding/page.tsx` (FIXED)
6. `app/vibe/page.tsx` (FIXED)
7. `app/chat/page.tsx` (FIXED)
8. `app/profile/page.tsx` (FIXED)
9. `app/calendar/page.tsx` (FIXED)
10. `app/conversations/page.tsx` (FIXED)
11. `components/onboarding/OnboardingController.tsx` (UPDATED)

## Testing Checklist

- [ ] Logged-out user sees welcome page at `/`
- [ ] Logged-out user redirected from protected pages to `/`
- [ ] Logged-in user with incomplete onboarding redirected to `/onboarding`
- [ ] Logged-in user with complete onboarding never sees welcome page
- [ ] Logged-in user with complete onboarding redirected from `/` to `/vibe`
- [ ] Logged-in user with complete onboarding can access `/profile` without redirect
- [ ] Logged-in user with complete onboarding can access `/chat` without redirect
- [ ] Onboarding completion redirects to `/vibe` (not `/chat`)
- [ ] All redirects use `router.replace()` (no back button issues)

## Build Status

✅ TypeScript compilation: PASSING
✅ No type errors
⚠️ Some ESLint warnings (non-blocking, related to React hooks dependencies)

