# How to Run Database Migrations in Supabase

## Quick Fix: Add Interests Column

The `interests` column is missing from your `users` table. Run this SQL in Supabase:

### Step 1: Go to Supabase SQL Editor

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (left sidebar)

### Step 2: Run This SQL

Copy and paste this into the SQL Editor and click **Run**:

```sql
-- Add interests column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';

-- Create index for interests (useful for matching queries)
CREATE INDEX IF NOT EXISTS idx_users_interests ON users USING GIN(interests);
```

### Step 3: Verify It Worked

Run this query to check:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'interests';
```

You should see a row with `interests` and `ARRAY` as the data type.

## Run All Migrations (If Needed)

If you need to run all migrations, here's the order:

1. **001_initial_schema.sql** - Creates all base tables
2. **002_add_updated_at_to_users.sql** - Adds updated_at column
3. **003_add_interests_to_users.sql** - Adds interests column (THIS ONE!)
4. **004_add_matching_and_relationships.sql** - Adds matching tables

## Alternative: Run All at Once

You can also run this combined migration:

```sql
-- Add interests column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';

-- Create index for interests
CREATE INDEX IF NOT EXISTS idx_users_interests ON users USING GIN(interests);

-- Add relationship_tier to chat_matches
ALTER TABLE chat_matches
ADD COLUMN IF NOT EXISTS relationship_tier TEXT DEFAULT 'community' 
CHECK (relationship_tier IN ('community', 'close_friend', 'inner_circle'));

-- Create relationships table
CREATE TABLE IF NOT EXISTS relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'community' 
    CHECK (tier IN ('community', 'close_friend', 'inner_circle')),
  message_count INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- Create indexes for relationships
CREATE INDEX IF NOT EXISTS idx_relationships_user1_id ON relationships(user1_id);
CREATE INDEX IF NOT EXISTS idx_relationships_user2_id ON relationships(user2_id);
CREATE INDEX IF NOT EXISTS idx_relationships_tier ON relationships(tier);
```

## Troubleshooting

### Error: "column already exists"
- The column is already there, you're good! The `IF NOT EXISTS` should prevent this, but if you see it, the migration already ran.

### Error: "relation users does not exist"
- You need to run `001_initial_schema.sql` first to create the users table.

### Error: "permission denied"
- Make sure you're running this in the Supabase SQL Editor, not through the API.
- You need to be the project owner or have SQL execution permissions.

## After Running Migration

1. Refresh your app
2. Try signing up/onboarding again
3. The interests column should now work!

