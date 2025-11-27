# Database Cleanup Guide

## What to Delete

### 1. **`vibe` column from `users` table** ✅ RECOMMENDED
- **Status**: Obsolete - replaced by `mood` column
- **Migration**: `033_remove_vibe_column.sql` (already created)
- **Impact**: 
  - The new profile page uses `mood` instead
  - However, `/vibe` page and match feed API still reference `vibe`
  - **Action needed**: Update code references first, then run migration

### 2. **`vibes` table** ⚠️ OPTIONAL
- **Status**: Separate table for vibe history
- **Still used by**: 
  - `/api/vibes` endpoint
  - Personality migration script
  - `lib/supabase-helpers.ts` (`saveVibe`, `getLastVibe`, `getUserVibes`)
- **Decision**: 
  - **Keep** if you want to preserve vibe history
  - **Delete** if you don't need historical vibe data
- **If deleting**: Drop the entire `vibes` table

### 3. **Code Updates Needed Before Deleting `vibe` Column**

Before running migration `033_remove_vibe_column.sql`, update these files:

1. **`app/api/match/feed/route.ts`**:
   - Line 75: Change `.select('vibe, topic')` to `.select('mood, topic')`
   - Line 92: Change `.select('id, name, interests, vibe, topic, ...')` to use `mood`
   - Line 113: Change `if (currentUser?.vibe || currentUser?.topic)` to `if (currentUser?.mood || currentUser?.topic)`
   - Line 117: Change `.select('id, name, interests, vibe, topic, ...')` to use `mood`
   - Line 130: Change `.or(\`vibe.eq.${currentUser.vibe || ''},topic.eq...\`)` to use `mood`
   - Line 150: Change `.select('id, name, interests, vibe, topic, ...')` to use `mood`
   - Line 196: Change `vibe: user.vibe || null,` to `mood: user.mood || null,`

2. **`app/vibe/page.tsx`**:
   - Line 81: Change `updates.vibe = selectedVibeObj.label` to `updates.mood = selectedVibeObj.label`
   - **OR** consider redirecting `/vibe` to `/topic-match` since that's the new flow

## Recommended Cleanup Steps

### Step 1: Update Code References
Update all `vibe` references to `mood` in:
- `app/api/match/feed/route.ts`
- `app/vibe/page.tsx` (or redirect to `/topic-match`)

### Step 2: Run Migration
```sql
-- Run migration 033_remove_vibe_column.sql
-- This will:
-- 1. Drop idx_users_vibe index
-- 2. Drop vibe column from users table
```

### Step 3: Optional - Remove `vibes` Table
If you don't need vibe history:
```sql
DROP TABLE IF EXISTS vibes CASCADE;
DROP INDEX IF EXISTS idx_vibes_user_id;
```

### Step 4: Clean Up Unused Code (Optional)
After database cleanup, you can remove:
- `app/api/vibes/route.ts` (if not using vibe history)
- `lib/supabase-helpers.ts` functions: `saveVibe`, `getLastVibe`, `getUserVibes`
- References in `app/api/migrate/personality/route.ts`

## Current State

- ✅ `mood` column exists in `users` table (migration 032)
- ✅ Profile page uses `mood`
- ⚠️ `vibe` column still exists (migration 031)
- ⚠️ Some code still references `vibe` (needs update)
- ⚠️ `vibes` table still exists (optional to keep)

