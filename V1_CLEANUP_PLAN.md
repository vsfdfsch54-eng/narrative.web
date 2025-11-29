# Narrative V1 Cleanup Plan

## Status: ⚠️ V1 Contamination Detected

Based on the comprehensive audit, this plan outlines step-by-step actions to achieve full V2 compliance.

---

## IMMEDIATE FIXES (Before Release)

### ✅ COMPLETED:
1. ✅ Created `/api/loops/create-from-match/route.ts`
2. ✅ Updated swipe route to auto-create Loop on dual right swipe

### 🔴 CRITICAL (Do Before Release):

#### 1. Redirect Legacy Pages to V2 Equivalents

**Files to Update:**
- `app/conversations/page.tsx` → Redirect to `/loops`
- `app/calendar/page.tsx` → Redirect to `/events`
- `app/feedback/page.tsx` → Redirect to `/profile-v2` or update to V2
- `app/profile/page.tsx` → Redirect to `/profile-v2`

**Implementation:**
```typescript
// Add at top of each legacy page
useEffect(() => {
  router.replace('/loops') // or appropriate V2 route
}, [])
```

#### 2. Update Feedback API to V2 Structure

**File:** `app/api/feedback/route.ts`

**Change:**
- Replace `match_id` with `target_id` (UUID, nullable)
- Add `feedback_type` field ('user' | 'loop' | 'event' | 'matchmaking' | 'call')
- Update to use V2 feedback structure

#### 3. Remove or Deprecate V1 API Routes

**Options:**
- **Option A (Recommended):** Delete immediately
  - Delete `app/api/matches/route.ts`
  - Delete `app/api/calendar/route.ts` (events API already exists)

- **Option B:** Add deprecation warnings and redirect
  - Return 410 Gone with message pointing to V2 routes

---

## SHORT-TERM CLEANUP (Post-Release)

### Phase 1: Remove V1 Helper Functions

**File:** `lib/supabase-helpers.ts`

**Actions:**
1. Delete or comment out:
   - `createMatch()`
   - `getNextMatch()`
   - `updateMatchStatus()`
   - `sendMessage()` (V1 version)
   - `getMessages()` (V1 version)
   - `createCalendarEvent()`
   - `getEventsForMonth()`
   - `getUserEvents()`
   - `autoMatchUser()`

2. Keep:
   - `getUser()`
   - `getAllTopics()`
   - `submitFeedback()` (but update to V2 structure)

### Phase 2: Update Legacy Components

**Files:**
1. `components/ui/navbar.tsx`
   - Check if still used
   - If unused → Delete
   - If used → Update to redirect to V2 routes

2. `components/ui/profile-card.tsx`
   - Check if used in V2 matchmaking
   - If unused → Delete

3. `components/AppShell.tsx`
   - Update to use `tokensV2` or delete if unused

### Phase 3: Clean Up Types

**Files:**
1. `types/database.ts`
   - Mark V1 tables as deprecated
   - Add comments indicating V2 alternatives

2. `types/database-v2.ts`
   - Verify all V2 tables are defined
   - Ensure no missing types

---

## LONG-TERM CLEANUP (Future)

### Database Migration
- Consider dropping V1 tables after migration period:
  - `chat_matches` (replaced by `matchmaking_sessions`)
  - `messages` (replaced by `loop_messages`)
  - `calendar_events` (replaced by `events`)

### Documentation
- Update all docs to remove V1 references
- Archive V1 migration files
- Create migration guide for existing users

---

## PRIORITY ORDER

### 🔴 CRITICAL (Do Now):
1. Redirect legacy pages
2. Update feedback API
3. Remove V1 API routes

### 🟡 HIGH (Do Soon):
1. Clean up helper functions
2. Update legacy components
3. Fix notification navigation

### 🟢 MEDIUM (Do Later):
1. Clean up types
2. Update documentation
3. Database cleanup

---

## FILES TO DELETE

```
app/api/matches/route.ts
app/api/calendar/route.ts
app/conversations/page.tsx (after redirect)
app/calendar/page.tsx (after redirect)
app/feedback/page.tsx (after redirect or update)
app/profile/page.tsx (after redirect)
components/ui/navbar.tsx (if unused)
components/ui/profile-card.tsx (if unused)
```

## FILES TO UPDATE

```
lib/supabase-helpers.ts - Remove V1 functions
app/api/feedback/route.ts - Update to V2 structure
app/notifications/page.tsx - Update navigation
types/database.ts - Mark V1 as deprecated
```

---

## SUCCESS CRITERIA

✅ All legacy pages redirect to V2
✅ No V1 API routes accessible
✅ No references to `chat_matches`, `messages` (V1), `calendar_events`
✅ All components use `tokensV2`
✅ Stay Connected creates Loop automatically
✅ All navigation uses V2 routes

---

## ESTIMATED EFFORT

- **Immediate Fixes:** 2-3 hours
- **Short-term Cleanup:** 4-6 hours
- **Long-term Cleanup:** 2-4 hours

**Total:** ~8-13 hours of cleanup work

