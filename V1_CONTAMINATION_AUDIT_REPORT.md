# Narrative V1 Contamination Audit Report

**Date:** Generated during V2.0 release preparation  
**Status:** ⚠️ **PROJECT CONTAINS V1 CONTAMINATION**

---

## EXECUTIVE SUMMARY

The codebase contains **significant V1 legacy code** that needs to be removed or refactored. While V2 infrastructure is in place, many V1 components, routes, and database calls remain active.

### Contamination Level: **MODERATE-HIGH**

- ✅ V2 core infrastructure exists (Loops, Events, Matchmaking V2)
- ⚠️ V1 routes and pages still exist and are accessible
- ⚠️ V1 database tables (`chat_matches`, `messages`, `calendar_events`) still referenced
- ⚠️ V1 helper functions still in use
- ⚠️ Legacy pages using old design tokens

---

## 1. KEYWORD SEARCH RESULTS

### Files Containing V1 Keywords:

#### "thread" / "chat_thread" / "match_thread"
- `app/notifications/page.tsx` - References to old chat/thread navigation
- `package-lock.json` - Dependency references (acceptable)

#### "preferences" / "moodPreference" / "intentionPreference" / "topicPreference"
- ✅ **ACCEPTABLE** - These are V2 onboarding preferences (stored in `users` table)
- Files: `context/OnboardingV2Context.tsx`, `app/api/onboarding-v2/complete/route.ts`, onboarding step components
- **Status:** These are CORRECT for V2 - preferences are stored during onboarding

#### "matchQueue" / "chatMatch"
- `lib/supabase-helpers.ts` - Contains V1 matchmaking functions
- Migration files (acceptable - historical)

#### "v1" / "legacy" / "deprecated"
- Multiple documentation files (acceptable)
- `lib/user-helpers-v2.ts` - V2 helper (correct)
- `app/page.tsx` - Schema version checking (correct)

---

## 2. OLD ARCHITECTURE PATTERNS FOUND

### ❌ CRITICAL: V1 Database Tables Still Referenced

#### Files Using `chat_matches`:
1. **`lib/supabase-helpers.ts`**
   - `createMatch()` - Creates V1 chat_matches
   - `getNextMatch()` - Fetches from chat_matches
   - `updateMatchStatus()` - Updates chat_matches
   - `sendMessage()` - Uses chat_matches
   - `getMessages()` - Uses chat_matches
   - `autoMatchUser()` - Uses chat_matches

2. **`app/api/matches/route.ts`**
   - Entire file uses V1 `chat_matches` table
   - POST, GET, PATCH all reference old matching system

3. **`app/api/feedback/route.ts`**
   - References `match_id` from `chat_matches` (should use `matchmaking_sessions`)

#### Files Using `messages` (V1):
1. **`lib/supabase-helpers.ts`**
   - `sendMessage()` - Inserts into old `messages` table
   - `getMessages()` - Fetches from old `messages` table

#### Files Using `calendar_events` (V1):
1. **`lib/supabase-helpers.ts`**
   - `createCalendarEvent()` - Uses V1 `calendar_events` table
   - `getEventsForMonth()` - Uses V1 `calendar_events` table
   - `getUserEvents()` - Uses V1 `calendar_events` table

2. **`app/api/calendar/route.ts`**
   - Entire file uses V1 `calendar_events` table
   - Should use V2 `events` table instead

### ❌ CRITICAL: V1 Pages Still Active

#### Legacy Pages Using V1 Architecture:
1. **`app/conversations/page.tsx`**
   - Uses `/api/chats` (V1 endpoint)
   - Uses `/api/messages` (V1 endpoint)
   - References `chat_matches` structure
   - Uses old design tokens (`tokens` instead of `tokensV2`)

2. **`app/calendar/page.tsx`**
   - Uses `/api/calendar` (V1 endpoint)
   - Uses `calendar_events` table
   - Uses old design tokens
   - V1 calendar structure (day-based, not datetime-based)

3. **`app/profile/page.tsx`**
   - Uses old design tokens
   - References V1 chat structure
   - Uses localStorage for community (should use Loops)

4. **`app/feedback/page.tsx`**
   - Uses `/api/feedback` with `matchId` (V1)
   - References `chat_matches`
   - Uses old design tokens

5. **`app/notifications/page.tsx`**
   - Navigation to `/chat/${userId}` (V1 route)
   - References `matchId` from V1 matches
   - Uses old design tokens

### ⚠️ Missing V2 Features

1. **Stay Connected → Loop Creation**
   - `app/messaging-only/[sessionId]/page.tsx` has TODO comment
   - Calls `/api/loops/create-from-match` which **DOES NOT EXIST**
   - Should create Loop when both users swipe right

2. **Visibility Hierarchy Enforcement**
   - Database trigger exists in migration
   - But no client-side validation in event creation

3. **Growth OFF Behavior**
   - Database field exists
   - But no UI enforcement or logic

---

## 3. FILE STRUCTURE ANALYSIS

### ✅ V2 Routes (Correct):
- `/onboarding-v2` ✅
- `/home-v2` ✅
- `/match-v2` ✅
- `/loops` ✅
- `/loops/[id]` ✅
- `/events` ✅
- `/events/[id]` ✅
- `/profile-v2` ✅
- `/messaging-only/[sessionId]` ✅

### ❌ V1 Routes (Should be Removed or Redirected):
- `/conversations` - Uses V1 chat system
- `/calendar` - Uses V1 calendar_events
- `/profile` - Uses V1 design tokens
- `/feedback` - Uses V1 matchId
- `/notifications` - References V1 routes
- `/invite` - Uses V1 structure

### ⚠️ Missing Routes:
- None - all required V2 routes exist

### ❌ Extra/Unused Routes:
- `/api/matches` - V1 matchmaking (should be removed)
- `/api/calendar` - V1 calendar (should be removed or updated)
- `/api/feedback` - Uses V1 matchId (should be updated)

---

## 4. COMPONENT ANALYSIS

### ✅ V2 Components (Correct):
- `components/onboarding-v2/**` ✅
- `components/match-v2/**` ✅
- `components/ui/navbar-v2.tsx` ✅
- `components/ui/create-loop-modal.tsx` ✅
- `components/ui/create-event-modal.tsx` ✅

### ❌ Legacy Components Using V1 Patterns:
1. **`components/ui/navbar.tsx`**
   - Old navbar with V1 routes
   - Still used by legacy pages

2. **`components/ui/profile-card.tsx`**
   - Old match card UI
   - Not used in V2 matchmaking

3. **`components/ui/chat-bubble.tsx`**
   - Old chat UI component
   - May be used by legacy conversations page

4. **`components/AppShell.tsx`**
   - Used by legacy pages
   - Uses old design tokens

### ⚠️ Design Token Usage:
- V2 pages use `tokensV2` ✅
- Legacy pages use `tokens` (V1) ❌
- Mixed usage creates inconsistency

---

## 5. SUPABASE SCHEMA CALLS

### ❌ V1 Table References:

#### `chat_matches` (Should be `matchmaking_sessions`):
- `lib/supabase-helpers.ts`: `createMatch()`, `getNextMatch()`, `updateMatchStatus()`
- `app/api/matches/route.ts`: All operations
- `app/conversations/page.tsx`: Indirect via API

#### `messages` (Should be `loop_messages`):
- `lib/supabase-helpers.ts`: `sendMessage()`, `getMessages()`
- `app/conversations/page.tsx`: Indirect via API

#### `calendar_events` (Should be `events`):
- `lib/supabase-helpers.ts`: `createCalendarEvent()`, `getEventsForMonth()`, `getUserEvents()`
- `app/api/calendar/route.ts`: All operations
- `app/calendar/page.tsx`: Indirect via API

#### `feedback` (Structure needs update):
- `app/api/feedback/route.ts`: References `match_id` (should be `target_id` + `feedback_type`)
- `lib/supabase-helpers.ts`: `submitFeedback()` uses `match_id`

### ✅ V2 Table References (Correct):
- `loops`, `loop_participants`, `loop_messages` ✅
- `events`, `event_participants` ✅
- `matchmaking_sessions` ✅
- `ai_signals`, `safety_flags` ✅

---

## 6. ENV + CONFIG CONSISTENCY

### ✅ Correct:
- Supabase config uses current endpoints
- OpenAI calls use new AI layer
- No deprecated secrets found
- No socket.io or firebase references

### ⚠️ Notes:
- `package.json` is clean (no old dependencies)
- All env vars are current

---

## 7. SAFETY + MODERATION LOGIC

### ✅ Implemented:
- `safety_flags` table exists
- RLS policies exist
- Database triggers for visibility hierarchy

### ❌ Missing:
- **Stay Connected → Loop Creation**: API route `/api/loops/create-from-match` does not exist
- **Visibility Hierarchy**: Client-side validation missing
- **Growth OFF**: No UI enforcement
- **Private Link Override**: Logic exists in DB but not in UI
- **Moderation Pipeline**: No reporting UI in V2 components

---

## 8. DETAILED FIX PLAN

### PHASE 1: Remove V1 API Routes (HIGH PRIORITY)

#### Delete:
1. `app/api/matches/route.ts` - Replace with matchmaking-v2
2. `app/api/calendar/route.ts` - Replace with events API (already exists)

#### Update:
1. `app/api/feedback/route.ts` - Change `match_id` to `target_id` + `feedback_type`

### PHASE 2: Remove/Redirect V1 Pages (HIGH PRIORITY)

#### Options:
**Option A: Delete and Redirect**
- Delete: `app/conversations/page.tsx`, `app/calendar/page.tsx`, `app/feedback/page.tsx`
- Redirect to: `/loops`, `/events`, `/profile-v2`

**Option B: Update to V2**
- Convert `app/conversations/page.tsx` → Use Loops API
- Convert `app/calendar/page.tsx` → Use Events API
- Convert `app/feedback/page.tsx` → Use V2 feedback structure

#### Recommendation: **Option A** (Delete and Redirect)

### PHASE 3: Clean Up Helper Functions (MEDIUM PRIORITY)

#### Update `lib/supabase-helpers.ts`:
1. **Mark as deprecated** or **delete**:
   - `createMatch()` - Use matchmaking-v2
   - `getNextMatch()` - Use matchmaking-v2
   - `updateMatchStatus()` - Use matchmaking-v2
   - `sendMessage()` - Use loop_messages
   - `getMessages()` - Use loop_messages
   - `createCalendarEvent()` - Use events API
   - `getEventsForMonth()` - Use events API
   - `getUserEvents()` - Use events API
   - `autoMatchUser()` - Use matchmaking-v2

2. **Keep** (still used):
   - `getUser()`
   - `getAllTopics()`
   - `submitFeedback()` - But update to V2 structure

### PHASE 4: Implement Missing V2 Features (HIGH PRIORITY)

1. **Create `/api/loops/create-from-match` route**
   - Called from `messaging-only/[sessionId]/page.tsx`
   - Creates Loop when both users swipe right
   - Adds both users as participants

2. **Update Swipe Logic**
   - `app/api/matchmaking-v2/session/[sessionId]/swipe/route.ts`
   - When both swipe right → create Loop automatically
   - Navigate to Loop instead of messaging-only

3. **Add Visibility Hierarchy UI**
   - Validate in event creation modal
   - Show warning if event visibility < loop visibility

4. **Add Growth OFF Enforcement**
   - Disable "Add Participant" button when growth_enabled = false
   - Show UI indicator

### PHASE 5: Update Legacy Components (MEDIUM PRIORITY)

1. **Delete or Update**:
   - `components/ui/navbar.tsx` - Delete if all pages use navbar-v2
   - `components/ui/profile-card.tsx` - Delete if unused
   - `components/AppShell.tsx` - Update to use tokensV2 or delete

2. **Update Design Tokens**:
   - Convert all legacy pages to `tokensV2`
   - Or delete legacy pages

### PHASE 6: Clean Up Types (LOW PRIORITY)

1. **Update `types/database.ts`**:
   - Mark V1 tables as deprecated
   - Or create separate `types/database-v1.ts` for legacy

2. **Update `types/database-v2.ts`**:
   - Ensure all V2 tables are defined
   - Add missing types if any

---

## SUMMARY OF FILES TO FIX

### Files to DELETE:
1. `app/api/matches/route.ts`
2. `app/api/calendar/route.ts` (or update to use events)
3. `app/conversations/page.tsx` (redirect to `/loops`)
4. `app/calendar/page.tsx` (redirect to `/events`)
5. `app/feedback/page.tsx` (redirect or update)
6. `components/ui/navbar.tsx` (if unused)
7. `components/ui/profile-card.tsx` (if unused)

### Files to UPDATE:
1. `lib/supabase-helpers.ts` - Remove or deprecate V1 functions
2. `app/api/feedback/route.ts` - Update to V2 structure
3. `app/messaging-only/[sessionId]/page.tsx` - Fix Loop creation
4. `app/api/matchmaking-v2/session/[sessionId]/swipe/route.ts` - Auto-create Loop on dual swipe
5. `app/notifications/page.tsx` - Update navigation to V2 routes
6. `app/profile/page.tsx` - Update to use tokensV2 or redirect to profile-v2

### Files to CREATE:
1. `app/api/loops/create-from-match/route.ts` - Create Loop from matchmaking session

---

## RECOMMENDED ACTION PLAN

### Immediate (Before Release):
1. ✅ Create `/api/loops/create-from-match` route
2. ✅ Update swipe logic to auto-create Loop
3. ✅ Redirect legacy pages to V2 equivalents

### Short-term (Post-Release):
1. Delete V1 API routes
2. Clean up helper functions
3. Update remaining legacy pages

### Long-term (Cleanup):
1. Remove all V1 database table references
2. Consolidate design tokens
3. Remove unused components

---

## CONCLUSION

**Status:** ⚠️ **V1 CONTAMINATION PRESENT**

The project has V2 infrastructure in place but still contains significant V1 code. The core V2 features (Loops, Events, Matchmaking V2) are functional, but legacy pages and API routes remain active.

**Recommendation:** Implement Phase 1-4 fixes before release to ensure clean V2 architecture.

