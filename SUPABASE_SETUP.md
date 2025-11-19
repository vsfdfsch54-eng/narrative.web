# Supabase Integration Setup Guide

This document explains how to set up and use Supabase in the Narrative app.

## 1. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

You can find these values in your Supabase project settings:
- Go to https://app.supabase.com
- Select your project
- Go to Settings → API
- Copy the Project URL and anon/public key
- Copy the service_role key (keep this secret!)

## 2. Database Setup

### Option A: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and run it in the SQL Editor

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## 3. File Structure

```
narrative/
├── lib/
│   ├── supabaseClient.ts          # Supabase client configuration
│   └── supabase-helpers.ts         # Helper functions for database operations
├── types/
│   └── database.ts                 # TypeScript types for database tables
├── app/
│   └── api/
│       ├── vibes/
│       │   └── route.ts            # API route for saving vibes
│       ├── matches/
│       │   └── route.ts            # API routes for chat matches
│       ├── messages/
│       │   └── route.ts            # API routes for messages
│       ├── calendar/
│       │   └── route.ts            # API routes for calendar events
│       └── feedback/
│           └── route.ts            # API route for feedback
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql  # Database schema migration
```

## 4. Usage Examples

### Saving a Vibe

```typescript
import { saveVibe } from '@/lib/supabase-helpers'

const vibe = await saveVibe(userId, 'Creative Flow')
```

### Creating a Match

```typescript
import { createMatch } from '@/lib/supabase-helpers'

const match = await createMatch(user1Id, user2Id, 'Tech News')
```

### Sending a Message

```typescript
import { sendMessage } from '@/lib/supabase-helpers'

const message = await sendMessage(matchId, userId, 'Hello!')
```

### Using API Routes

```typescript
// POST /api/vibes
const response = await fetch('/api/vibes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: '...', vibe: 'Creative Flow' })
})

// GET /api/matches?userId=...
const response = await fetch('/api/matches?userId=...')
```

## 5. Helper Functions Available

- `saveVibe(userId, vibe)` - Save a vibe for a user
- `saveTopic(label, emoji, blurb, category)` - Save a topic
- `createMatch(user1Id, user2Id, topic)` - Create a chat match
- `getNextMatch(userId)` - Get the next available match
- `sendMessage(matchId, senderId, text)` - Send a message
- `getMessages(matchId)` - Get all messages for a match
- `createCalendarEvent(userId, day, title, location, timeSlot, groupType)` - Create calendar event
- `getEventsForMonth(userId, year, month)` - Get events for a month
- `submitFeedback(matchId, userId, emoji, notes)` - Submit feedback

## 6. Row Level Security (RLS)

The database schema includes RLS policies that:
- Allow users to read/update their own data
- Allow users to read messages from their matches
- Allow users to insert messages to their matches
- Make topics publicly readable

**Note:** You may need to adjust RLS policies based on your authentication setup. The current policies assume you're using Supabase Auth with `auth.uid()`.

## 7. Next Steps

1. Set up Supabase Authentication (if not already done)
2. Update RLS policies to match your auth requirements
3. Integrate API calls into your existing UI components
4. Add error handling and loading states
5. Consider adding real-time subscriptions for messages

## 8. Testing

You can test the API routes using:

```bash
# Test saving a vibe
curl -X POST http://localhost:3000/api/vibes \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-id","vibe":"Creative Flow"}'

# Test getting matches
curl http://localhost:3000/api/matches?userId=test-id
```

