# Narrative App - Current State & Issues Prompt for ChatGPT

## App Overview

**Narrative** is a modern social connection app that uses AI-powered matching to connect users for meaningful conversations. The app features a premium, dark-themed UI inspired by Apple/OpenAI design aesthetics with smooth animations and a minimalist interface.

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: TailwindCSS with custom design tokens
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **UI Libraries**: 
  - Framer Motion for animations
  - Lucide React for icons
  - Custom component library (shadcn/ui inspired)
- **AI**: OpenAI API for personality analysis and matching
- **Deployment**: Vercel

## App Structure & Features

### Core Pages & Navigation

1. **Home/Welcome Page (`/`)**
   - Landing page for unauthenticated users
   - Shows "Welcome to Narrative" with "Create Account" and "Sign In" buttons
   - Should redirect authenticated users to `/vibe` (if onboarding complete) or `/onboarding` (if incomplete)

2. **Onboarding Flow (`/onboarding`)**
   - Multi-step process: Email → Password → Name (first & last) → 10 Questions (multiple choice) → Interests (multi-select) → Confirmation
   - Account creation happens at password step
   - All progress saved to Supabase `users` table
   - Uses `OnboardingContext` for state management
   - Non-blocking navigation with background saves

3. **Vibe/Topic Selection (`/vibe`)**
   - Main entry point after onboarding
   - Users select:
     - **Vibe**: Energy level (Chill, Energetic, Deep, Playful, etc.)
     - **Topic**: Conversation topics by category (General, Pop Culture, News, Sports)
     - **Timer**: Optional time limit (5/15/30 min or flexible)
   - "Connect now" button triggers AI matching
   - "Skip for now" allows quick matching without preferences

4. **Chat/Matching Page (`/chat`)**
   - Shows AI matching status ("AI is Finding Your Match")
   - Polls for matches via `/api/connect/status`
   - When matched, redirects to individual chat (`/chat/[userId]`)
   - Shows empty state if no matches found

5. **Profile Page (`/profile`)**
   - User profile with editable name
   - Personality summary (AI-generated)
   - Friends/Community section
   - Recent chats
   - Notifications
   - Sign out button

6. **Calendar Page (`/calendar`)**
   - Upcoming events and connections

7. **Conversations Page (`/conversations`)**
   - List of all conversations

### Navigation Bar

Bottom navigation bar (NavBar component) with 4 items:
- **Home** → `/vibe` (vibe/topic selection)
- **Chat** → `/chat` (matching page)
- **Calendar** → `/calendar`
- **Profile** → `/profile`

## UI/UX Design System

### Design Tokens (`lib/design-tokens.ts`)
- **Colors**: Dark theme with `#0a0a0c` background, white text with opacity variations
- **Typography**: Custom font sizes and weights
- **Spacing**: Consistent spacing scale
- **Components**: Pills, buttons, cards with glassmorphism effects
- **Animations**: Smooth transitions via Framer Motion

### Key UI Patterns
- Glassmorphism: `bg-black/60 backdrop-blur-xl` for navigation
- Pill buttons: Rounded buttons with selected/unselected states
- Loading states: Animated dots and spinners
- Empty states: Helpful messages when no data
- Responsive: Mobile-first design

## Current Issues & Problems

### 1. Routing Guards & Redirects (CRITICAL)

**Problem**: Inconsistent routing behavior causing users to see wrong pages or get stuck in redirect loops.

**Specific Issues**:
- Logged-in users sometimes see the Welcome page (`/`) instead of being redirected
- After completing onboarding, users should go to `/vibe` but sometimes end up at `/` or `/chat`
- Profile and Chat pages sometimes redirect to `/` even when user is authenticated
- Pages don't consistently wait for `useAuth().loading === false` before checking auth state
- Some pages use `router.push()` instead of `router.replace()` causing back button issues

**Expected Behavior**:
1. Logged-out users → See Welcome page at `/`
2. Logged-in users → Never see Welcome page again
3. After onboarding complete → `/` should always redirect to `/vibe`
4. Profile/Chat pages → Should never redirect to `/` unless user is actually logged out
5. All pages → Must wait for `authLoading === false` before doing redirect checks

**Files Affected**:
- `app/page.tsx` (Home/Welcome)
- `app/profile/page.tsx`
- `app/chat/page.tsx`
- `app/vibe/page.tsx`
- `app/login/page.tsx`

### 2. Onboarding Flow Issues

**Problem**: Onboarding system has been rebuilt multiple times but still has edge cases.

**Current Flow**:
1. Email step → User enters email
2. Password step → Account created here via `signUp()`
3. Name step → First name + Last name
4. Questions step → 10 multiple-choice questions about personality
5. Interests step → Multi-select interests (categories + individual interests)
6. Confirmation step → Review and complete
7. Redirect to `/vibe`

**Known Issues**:
- "Please sign in to continue" message appears during onboarding (shouldn't)
- Race conditions between account creation and user hydration
- Background saves sometimes fail silently
- Navigation can be laggy on some steps

### 3. Authentication State Management

**Problem**: `useAuth()` hook sometimes doesn't immediately reflect auth state changes.

**Issues**:
- After `signUp()`, `user` object may not be immediately available
- `loading` state can be inconsistent
- Some pages check `user` before `loading === false`

### 4. Database Schema

**Users Table Fields**:
- `id` (UUID, primary key)
- `email` (TEXT)
- `first_name` (TEXT)
- `last_name` (TEXT)
- `name` (TEXT, legacy field)
- `questions_answers` (JSONB) - stores answers to 10 questions
- `interests` (TEXT[]) - array of interest IDs
- `onboarding_step` (TEXT) - one of: 'start', 'email', 'password', 'name', 'questions', 'interests', 'confirmation', 'complete'
- `onboarding_completed` (BOOLEAN)
- `personality_summary` (TEXT) - AI-generated
- `traits` (JSONB) - personality traits
- `created_at`, `updated_at` (TIMESTAMPS)

## What I Need Help With

1. **Fix all routing guards** to ensure:
   - Logged-out users only see Welcome page
   - Logged-in users never see Welcome page
   - Proper redirects based on onboarding status
   - All pages wait for auth loading to complete
   - Use `router.replace()` instead of `router.push()` for redirects

2. **Review and improve onboarding flow**:
   - Ensure no "please sign in" messages during onboarding
   - Fix race conditions with user hydration
   - Improve error handling for background saves

3. **UI/UX improvements**:
   - Ensure consistent loading states
   - Improve empty states
   - Fix any layout issues

4. **Code quality**:
   - Ensure TypeScript types are correct
   - Remove any unused code
   - Improve error handling

## Key Files to Review

- `app/page.tsx` - Home/Welcome page routing
- `app/profile/page.tsx` - Profile page with routing guards
- `app/chat/page.tsx` - Chat/matching page
- `app/vibe/page.tsx` - Vibe/topic selection
- `app/login/page.tsx` - Login page
- `components/onboarding/OnboardingController.tsx` - Onboarding orchestration
- `context/OnboardingContext.tsx` - Onboarding state management
- `hooks/use-auth.ts` - Authentication hook
- `lib/onboarding.ts` - Onboarding utilities

## Current Git Status

- Main branch with recent commits for onboarding fixes
- NavBar fix: Chat button now points to `/chat` instead of `/conversations`
- Multiple onboarding flow iterations completed

---

**Please help me fix the routing guards and ensure a smooth user experience with proper authentication and onboarding flow management.**

