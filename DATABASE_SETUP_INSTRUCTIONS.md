# Database Setup Instructions for Narrative V2.0

## What I've Done For You ✅

I've created a safe migration file that adds only the missing pieces:
- **`supabase/migrations/037_add_v2_indexes_rls_triggers.sql`**
  - This file adds indexes, RLS policies, and triggers
  - Safe to run multiple times (uses `IF NOT EXISTS` and `DROP IF EXISTS`)
  - Won't break your existing data

## What You Need To Do 🎯

### Step 1: Run the Migration in Supabase

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Paste the Migration**
   - Open the file: `supabase/migrations/037_add_v2_indexes_rls_triggers.sql`
   - Copy the entire contents
   - Paste into Supabase SQL Editor

4. **Run It**
   - Click "Run" (or press Cmd/Ctrl + Enter)
   - Wait for success message

### Step 2: Verify It Worked

After running, you should see:
- ✅ Success message
- ✅ No errors

You can verify by checking:
- **Indexes**: Go to Database → Indexes, you should see the new indexes
- **RLS Policies**: Go to Authentication → Policies, you should see the new policies
- **Functions**: Go to Database → Functions, you should see `update_updated_at_column`, `enforce_event_loop_visibility`, `remove_participant_from_loop_events`

## What This Migration Does

### 1. **Indexes** (Performance)
Creates indexes on:
- Loops (visibility, private_link)
- Loop participants (user_id, loop_id)
- Events (loop_id, date_time, visibility, private_link)
- Event participants (event_id, user_id)
- Matchmaking sessions (user1_id, user2_id, status, created_at)
- Loop messages (loop_id, sender_id, created_at)
- AI signals (user_id, signal_type, created_at)
- Safety flags (user_id, flagged_user_id, status, flag_type)

### 2. **RLS Policies** (Security)
Enables Row Level Security and creates policies so:
- Users can only read loops they're in
- Users can only read events they're invited to
- Users can only read their own matchmaking sessions
- Users can only read messages in loops they're in
- Users can only read their own AI signals and safety flags

### 3. **Triggers** (Data Integrity)
- Auto-updates `updated_at` timestamps on loops, events, and matchmaking sessions
- Enforces visibility hierarchy (event visibility >= loop visibility)
- Removes participants from loop events when removed from loop

## Troubleshooting

### If you get errors:

1. **"relation already exists"**
   - This is fine - the migration uses `IF NOT EXISTS`, so it should skip existing items
   - If you see this, it means that part is already set up

2. **"permission denied"**
   - Make sure you're using the SQL Editor (not a restricted user)
   - You need admin access to create indexes and policies

3. **"function already exists"**
   - The migration uses `CREATE OR REPLACE`, so this shouldn't happen
   - If it does, the function will be replaced (which is fine)

### If something breaks:

- The migration is designed to be safe
- It uses `IF NOT EXISTS` and `DROP IF EXISTS` to avoid conflicts
- Your data won't be deleted
- If you're worried, you can run it in a test database first

## Next Steps After Running

Once the migration is complete:
1. ✅ Your database will have all V2 indexes
2. ✅ RLS policies will be active
3. ✅ Triggers will be working
4. ✅ Your app should work with V2 features

You're ready to use Narrative V2.0! 🚀

