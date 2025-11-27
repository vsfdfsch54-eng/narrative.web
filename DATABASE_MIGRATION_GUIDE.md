# Database Migration Guide

## Required Migrations

You need to run these migrations in order to complete the vibe → mood transition:

### 1. **Migration 032: Add mood column** ✅
**File:** `supabase/migrations/032_add_mood_to_users.sql`

**What it does:**
- Adds `mood TEXT` column to `users` table
- Creates index `idx_users_mood` for performance
- Notifies PostgREST to reload schema

**Status:** Ready to run

**Command:**
```bash
# If using Supabase CLI
supabase db push

# Or apply directly in Supabase Dashboard SQL Editor
# Copy contents of 032_add_mood_to_users.sql
```

### 2. **Migration 033: Remove vibe column** ⚠️
**File:** `supabase/migrations/033_remove_vibe_column.sql`

**What it does:**
- Drops index `idx_users_vibe`
- Removes `vibe TEXT` column from `users` table
- Notifies PostgREST to reload schema

**Status:** Ready to run (code already updated to use mood)

**Command:**
```bash
# If using Supabase CLI
supabase db push

# Or apply directly in Supabase Dashboard SQL Editor
# Copy contents of 033_remove_vibe_column.sql
```

## Optional: Remove vibes table

If you don't need historical vibe data, you can drop the entire `vibes` table:

**SQL:**
```sql
-- Drop vibes table (optional - only if you don't need history)
DROP TABLE IF EXISTS vibes CASCADE;

-- Drop related indexes
DROP INDEX IF EXISTS idx_vibes_user_id;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
```

**Note:** This will permanently delete all historical vibe records. Only do this if you're sure you don't need this data.

## Migration Order

1. ✅ **First:** Run migration 032 (adds mood column)
2. ✅ **Second:** Run migration 033 (removes vibe column)
3. ⚠️ **Optional:** Drop vibes table if not needed

## Verification

After running migrations, verify:

```sql
-- Check mood column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'mood';

-- Check vibe column is removed
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'vibe';
-- Should return 0 rows

-- Check vibes table (if you kept it)
SELECT COUNT(*) FROM vibes;
```

## Important Notes

- **Backup first:** Always backup your database before running migrations
- **Test environment:** Test migrations in a development environment first
- **Data migration:** If you have existing `vibe` data you want to preserve, migrate it to `mood` before running migration 033:

```sql
-- Optional: Migrate existing vibe data to mood before dropping column
UPDATE users 
SET mood = vibe 
WHERE vibe IS NOT NULL AND mood IS NULL;
```

## Current State

- ✅ Code updated: All code now uses `mood` instead of `vibe`
- ✅ Migration 032 created: Adds `mood` column
- ✅ Migration 033 created: Removes `vibe` column
- ⚠️ **Action needed:** Run migrations in Supabase

