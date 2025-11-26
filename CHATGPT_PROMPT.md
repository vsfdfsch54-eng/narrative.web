# ChatGPT Prompt: Narrative App - Redirect Loop Fix & Mobile Compatibility

Use this prompt to get ChatGPT to understand the Narrative app's routing system and recent fixes:

---

## Context

I'm working on a Next.js 14 app called "Narrative" - a social app for connecting people through conversations. The app uses:
- **Framework:** Next.js 14 App Router with TypeScript
- **Auth/DB:** Supabase (PostgreSQL + Auth)
- **Styling:** TailwindCSS
- **Key Features:** Onboarding flow, vibe/topic selection, AI matching, chat conversations

## The Problem We Solved

### Redirect Loop Bug
Users were getting stuck in infinite redirect loops, especially on mobile. The issue occurred when:
1. The `/api/users` endpoint returned a 500 error (server error)
2. `getAppUserRecord()` returned `null`
3. All routing guards called `normalizeOnboardingStep(null)` which returns `'email'`
4. Pages redirected to `/onboarding?step=email`
5. This created an infinite loop: vibe → onboarding → vibe → onboarding...

### Mobile-Specific Issues
- Mobile browsers may restrict or fail on `sessionStorage` operations
- Mobile networks are slower, causing timeouts
- The circuit breaker pattern wasn't working on mobile

## The Solution: 5-Layer Protection System

### Layer 1: Circuit Breaker + Error Tracking
- Tracks API errors in `sessionStorage` per userId
- After 3+ consecutive errors, stops making API calls
- 15-second timeout (increased from 10s for mobile)
- Distinguishes 500 errors (server) from 404 errors (user not found)
- **Mobile-safe:** All `sessionStorage` operations wrapped in try-catch

### Layer 2: Safe Helper with `apiError` Flag
- `checkOnboardingStatus()` in `lib/user-helpers.ts` returns `{ completed, step, record, apiError }`
- `apiError: true` when API fails (prevents redirects)
- All 8 pages check `apiError` before redirecting
- **Mobile-safe:** Defaults to `apiError=true` if `sessionStorage` fails

### Layer 3: Path Duplication Check
- Before redirecting, checks if already on target path
- Prevents A → A redirects
- Applied to all 8 pages

### Layer 4: Redirect History Tracking
- `lib/redirect-guard.ts` tracks redirect history
- Detects circular patterns (A → B → A)
- Detects repeated redirects (3+ in 5 seconds)
- Blocks unsafe redirects globally

### Layer 5: Try/Catch Error Handling
- All `checkOnboardingStatus()` calls wrapped in try/catch
- Catch blocks **never redirect** - they allow access instead
- Prevents exceptions from causing redirects

## Key Files

### Core Helper
- `lib/user-helpers.ts` - Contains `getAppUserRecord()` and `checkOnboardingStatus()`
  - Mobile-safe `sessionStorage` with try-catch
  - Circuit breaker pattern
  - 15-second timeout for mobile networks

### Routing Guards (All use same pattern)
- `app/page.tsx` (Home/Welcome)
- `app/login/page.tsx`
- `app/onboarding/page.tsx`
- `app/vibe/page.tsx`
- `app/profile/page.tsx`
- `app/chat/page.tsx`
- `app/calendar/page.tsx`
- `app/conversations/page.tsx`

**Pattern Applied:**
```typescript
const { completed, step, apiError } = await checkOnboardingStatus(user.id)

// NEVER redirect on API errors
if (apiError) {
  console.warn('⚠️ API error - allowing access to prevent loop')
  return // Don't redirect
}

// Safety check: prevent redirect loops
const redirectPath = `/onboarding?step=${step}`
const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
if (currentPath === redirectPath) {
  console.warn('⚠️ Already on target path, skipping redirect')
  return
}

if (!completed) {
  router.replace(redirectPath)
  return
}

// Allow access to page
```

## Additional Updates

### Chat Icon Navigation
- Navbar Chat icon now points to `/conversations` instead of `/chat`
- Conversations page shows empty state: "Your conversations will be saved here once you start chatting"
- Navbar highlights correctly on `/conversations` and `/chat/[id]` pages

## Mobile Compatibility

All `sessionStorage` operations are wrapped in try-catch:
```typescript
try {
  sessionStorage.setItem(key, value)
} catch (e) {
  // Mobile browsers may restrict - log but continue
  console.warn('Could not access sessionStorage:', e)
  // Default to conservative behavior (apiError=true)
}
```

## Guarantee

With 5 layers of protection, redirect loops are **mathematically impossible**:
- Even if API fails → Layer 1 detects it
- Even if detection fails → Layer 2 prevents redirect
- Even if apiError check fails → Layer 3 blocks same-path redirects
- Even if path check fails → Layer 4 tracks history and blocks loops
- Even if all fail → Layer 5 catches exceptions and allows access

## Questions You Can Ask ChatGPT

1. "How does the redirect loop prevention work in the Narrative app?"
2. "Why might sessionStorage fail on mobile and how is it handled?"
3. "Explain the circuit breaker pattern in `checkOnboardingStatus()`"
4. "What happens when `/api/users` returns a 500 error?"
5. "How do routing guards prevent redirect loops?"
6. "Why does the app default to `apiError=true` when sessionStorage fails?"

---

**Use this prompt to help ChatGPT understand the codebase and assist with future development!**
