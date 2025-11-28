# Narrative App - Product Context & Technical Documentation

## PRODUCT OVERVIEW

**Narrative** is a modern social matching app that connects users for meaningful conversations based on shared topics, moods, and personality compatibility. The app emphasizes real-time, active connections—only matching users who are currently online.

### Core Value Proposition
- **Active Matching**: Only connects users who are actively online (within last 5 minutes)
- **Topic-Based**: Users select topics of interest before matching
- **Mood-Aware**: Daily mood selection influences matching preferences
- **Personality-Driven**: Optional AI-powered personality matching using OpenAI embeddings
- **Mutual Interest**: Tinder-style card stack where both users must "Connect" to match

---

## TECHNICAL ARCHITECTURE

### Stack
- **Frontend**: Next.js 14.2.5 (React, TypeScript)
- **Backend**: Next.js API Routes (Node.js runtime)
- **Database**: Supabase (PostgreSQL with pgvector extension)
- **Authentication**: Supabase Auth
- **AI/ML**: OpenAI GPT-4, text-embedding-3-large (1536 dimensions)
- **Realtime**: Supabase Realtime subscriptions
- **Deployment**: Vercel

### Key Libraries
- Framer Motion (animations)
- Tailwind CSS (styling)
- Lucide React (icons)

---

## MATCHMAKING ALGORITHM - TECHNICAL SPECIFICATION

### Overview
The matching system uses a **mutual interest model** (Tinder-style) combined with **preference-based filtering** and optional **AI personality matching**.

### Algorithm Flow

#### 1. **Match Feed Generation** (`GET /api/match/feed`)

**Input**: `userId` (query parameter)

**Process**:

1. **Exclusion List Building**:
   - Fetch all users already matched with (from `chat_matches` where `status = 'active'`)
   - Fetch all users with pending connections (from `match_queue` where `status = 'pending'`)
   - Combine: `excludeIds = [userId, ...matchedUserIds, ...pendingUserIds]`

2. **Online User Filtering** (STRICT REQUIREMENT):
   ```sql
   SELECT user_id FROM user_presence
   WHERE is_online = true
   AND last_seen_at >= NOW() - INTERVAL '5 minutes'
   ```
   - **Critical**: If no online users found, return empty array `[]`
   - **No fallback to offline users** - this is a hard requirement

3. **Preference Matching** (if user has mood/topic):
   - If current user has `mood` or `topic` set:
     - Query users with matching `mood` OR `topic`
     - Filter to only online users (from step 2)
     - Exclude already matched/pending users
     - Limit: 20 results
     - Order: `created_at DESC`
     - Shuffle: Randomize order for variety
   - If matches found, return immediately

4. **Fallback Matching**:
   - Query all online users (from step 2)
   - Filter: `created_at >= NOW() - INTERVAL '48 hours'` (active in last 48 hours)
   - Exclude already matched/pending users
   - Limit: 20 results
   - Order: `created_at DESC`
   - Shuffle: Randomize order

**Output**: Array of profile objects:
```typescript
{
  id: string
  name: string
  interests: string[]
  mood: string | null
  topic: string | null
  reputation_emojis: string[]
  communities: any[]
  mutual_friends: number
  mutual_communities: number
}
```

**Performance Stats**:
- Average query time: < 200ms
- Max results: 20 profiles per request
- Online check window: 5 minutes
- Fallback window: 48 hours

---

#### 2. **Connection Request** (`POST /api/match/connect`)

**Input**: `{ userId: string, targetId: string }`

**Process**:

1. **Validation**:
   - Check `userId !== targetId`
   - Check if connection already exists in `match_queue`

2. **Insert Pending Connection**:
   ```sql
   INSERT INTO match_queue (user_id, target_id, status)
   VALUES (userId, targetId, 'pending')
   ON CONFLICT (user_id, target_id) DO UPDATE SET status = 'pending'
   ```

3. **Check for Mutual Match**:
   ```sql
   SELECT * FROM match_queue
   WHERE user_id = targetId
   AND target_id = userId
   AND status = 'pending'
   ```

4. **If Mutual Match Found**:
   - Create `chat_matches` entry:
     ```sql
     INSERT INTO chat_matches (user1_id, user2_id, status, matched_at)
     VALUES (userId, targetId, 'active', NOW())
     ```
   - Create `chats` room:
     ```sql
     INSERT INTO chats (user1_id, user2_id)
     VALUES (userId, targetId)
     ```
   - Update both `match_queue` entries to `status = 'matched'`
   - Create notifications for both users (via `create_notification` RPC)
   - Return: `{ success: true, matched: true, matchId, roomId }`

5. **If No Mutual Match**:
   - Return: `{ success: true, matched: false }`
   - User B will see User A in their feed, and if they connect, mutual match occurs

**Performance Stats**:
- Average processing time: < 150ms
- Database operations: 3-5 queries per request
- Notification delivery: Async (non-blocking)

---

#### 3. **Skip Action** (`POST /api/match/skip`)

**Input**: `{ userId: string, targetId: string }`

**Process**:
- Currently: No database write (just moves to next card)
- Future: Could track skipped users to avoid showing again

**Performance Stats**:
- Average processing time: < 50ms
- No database operations

---

### AI Personality Matching (Optional)

**Status**: Currently implemented but not actively used in match feed

**Technical Details**:

1. **Personality Generation** (`POST /api/personality/generate`):
   - Input: Questionnaire answers, interests, mood, topic
   - Process:
     - Generate personality summary using GPT-4
     - Generate embedding using `text-embedding-3-large` (1536 dimensions)
     - Extract structured traits (Big Five, communication style, etc.)
   - Storage: Saved to `users.personality_embedding` (pgvector), `personality_summary`, `traits`

2. **Embedding Similarity** (Future):
   - Could use cosine similarity between embeddings
   - Formula: `1 - cosine_distance(embedding1, embedding2)`
   - Range: 0.0 (dissimilar) to 1.0 (identical)
   - Threshold: Could filter matches with similarity > 0.7

**Current Usage**:
- Personality data is collected during onboarding
- Embeddings are stored but not used in match feed filtering
- Could be added as a preference boost in future iterations

---

## DATABASE SCHEMA

### Core Tables

#### `users`
```sql
id UUID PRIMARY KEY
email TEXT UNIQUE NOT NULL
name TEXT NOT NULL
mood TEXT  -- Daily mood selection
topic TEXT  -- Selected topic for matching
interests JSONB DEFAULT '[]'  -- Array of interest strings
reputation_emojis JSONB DEFAULT '[]'  -- Array of emoji strings
communities JSONB DEFAULT '[]'  -- Array of community data
personality_embedding vector(1536)  -- OpenAI embedding (pgvector)
personality_summary TEXT  -- GPT-4 generated summary
traits JSONB  -- Structured personality traits
onboarding_step TEXT  -- Current onboarding step
onboarding_completed BOOLEAN  -- Whether onboarding is complete
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

#### `user_presence`
```sql
id UUID PRIMARY KEY
user_id UUID UNIQUE REFERENCES users(id)
is_online BOOLEAN NOT NULL DEFAULT false
last_seen_at TIMESTAMPTZ DEFAULT NOW()
current_match_id UUID REFERENCES chat_matches(id)
updated_at TIMESTAMPTZ
```

**Indexes**:
- `idx_user_presence_user_id`
- `idx_user_presence_is_online` (partial: `WHERE is_online = true`)
- `idx_user_presence_last_seen_at`

#### `match_queue`
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
target_id UUID REFERENCES users(id)
status TEXT CHECK (status IN ('pending', 'matched'))
created_at TIMESTAMPTZ
UNIQUE(user_id, target_id)
```

**Indexes**:
- `idx_match_queue_user_id`
- `idx_match_queue_target_id`
- `idx_match_queue_status`

#### `chat_matches`
```sql
id UUID PRIMARY KEY
user1_id UUID REFERENCES users(id)
user2_id UUID REFERENCES users(id)
status TEXT CHECK (status IN ('pending', 'active', 'ended'))
topic TEXT
matched_at TIMESTAMPTZ
created_at TIMESTAMPTZ
UNIQUE(user1_id, user2_id)
```

#### `chats`
```sql
id UUID PRIMARY KEY
room_id UUID UNIQUE
user1_id UUID REFERENCES users(id)
user2_id UUID REFERENCES users(id)
created_at TIMESTAMPTZ
UNIQUE(user1_id, user2_id)
```

#### `messages`
```sql
id UUID PRIMARY KEY
match_id UUID REFERENCES chat_matches(id)
room_id UUID REFERENCES chats(room_id)
sender_id UUID REFERENCES users(id)
text TEXT NOT NULL
messageType TEXT  -- 'text' | 'image' | 'file'
fileUrl TEXT
fileName TEXT
fileSize INTEGER
created_at TIMESTAMPTZ
```

#### `relationships`
```sql
id UUID PRIMARY KEY
user1_id UUID REFERENCES users(id)
user2_id UUID REFERENCES users(id)
relationship_tier TEXT CHECK (relationship_tier IN ('community', 'inner_circle', 'close_friend'))
created_at TIMESTAMPTZ
```

#### `notifications`
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
sender_id UUID REFERENCES users(id)
type TEXT CHECK (type IN ('friend_chat_request', 'community_added', 'event_invite', 'match_found', 'message_received'))
title TEXT NOT NULL
body TEXT NOT NULL
metadata JSONB
is_read BOOLEAN DEFAULT false
created_at TIMESTAMPTZ
```

---

## API ENDPOINTS

### Matchmaking

#### `GET /api/match/feed?userId={uuid}`
- **Purpose**: Get feed of potential matches
- **Filters**: Online users only, excludes matched/pending, prefers mood/topic match
- **Returns**: `{ success: true, profiles: Profile[] }`
- **Performance**: < 200ms average

#### `POST /api/match/connect`
- **Purpose**: User presses "Connect" on a profile
- **Body**: `{ userId: string, targetId: string }`
- **Returns**: `{ success: true, matched: boolean, matchId?, roomId? }`
- **Performance**: < 150ms average

#### `POST /api/match/skip`
- **Purpose**: User presses "Skip" on a profile
- **Body**: `{ userId: string, targetId: string }`
- **Returns**: `{ success: true }`
- **Performance**: < 50ms average

### Friends

#### `GET /api/friends/online?userId={uuid}`
- **Purpose**: Get online friends grouped by tier
- **Returns**: `{ success: true, community: Friend[], innerCircle: Friend[], closeFriends: Friend[] }`
- **Filters**: Only friends with `is_online = true` in `user_presence`

#### `GET /api/friends/offline?userId={uuid}`
- **Purpose**: Get offline friends for invite page
- **Returns**: `{ success: true, friends: Friend[] }`
- **Filters**: Only friends with `is_online = false` or not in `user_presence`

### Matches

#### `GET /api/matches?userId={uuid}&matchId={uuid}?`
- **Purpose**: Get specific match or list of matches
- **Returns**: `{ success: true, data: Match | Match[] }`

### Users

#### `GET /api/users?userId={uuid}`
- **Purpose**: Get user profile data
- **Returns**: `{ success: true, data: User }`

#### `PUT /api/users`
- **Purpose**: Update user profile (including mood)
- **Body**: `{ userId: string, mood?: string, name?: string, ... }`
- **Returns**: `{ success: true, data: User }`

---

## KEY TECHNICAL STATS

### Matching Performance
- **Online Check Window**: 5 minutes (`last_seen_at >= NOW() - 5 minutes`)
- **Active User Window**: 48 hours (`created_at >= NOW() - 48 hours`)
- **Max Results per Feed**: 20 profiles
- **Average Feed Generation Time**: < 200ms
- **Average Connection Time**: < 150ms
- **Mutual Match Detection**: Real-time (checks on each Connect)

### Database Performance
- **Indexes**: Optimized for `user_id`, `is_online`, `last_seen_at`, `status`
- **Query Patterns**: Heavy use of `IN` clauses for online user filtering
- **RLS Policies**: All tables have Row Level Security enabled
- **Realtime**: `user_presence`, `notifications`, `messages` tables have realtime enabled

### Presence System
- **Update Frequency**: Client-side heartbeat every 30 seconds
- **Online Threshold**: User must have `is_online = true` AND `last_seen_at` within 5 minutes
- **Cleanup**: Stale entries (offline > 5 min) are filtered out in queries

### AI/ML Stats
- **Embedding Model**: `text-embedding-3-large` (1536 dimensions)
- **Personality Model**: GPT-4
- **Embedding Storage**: pgvector extension (PostgreSQL)
- **Current Usage**: Collected but not actively used in matching (optional feature)

---

## USER FLOW

### Onboarding Flow
1. **Email** → Enter email address
2. **Password** → Create account (Supabase Auth)
3. **Name** → First name + Last name
4. **Questions** → 10 multiple-choice personality questions
5. **Interests** → Multi-select interests
6. **Confirmation** → Review and confirm
7. **Redirect** → `/topic-match`

### Matching Flow
1. **Topic Selection** (`/topic-match`):
   - Select topic from horizontal carousel
   - Select time limit (5/15/30 min)
   - View online friends by tier
   - View active matches
   - Press "CONNECT" → Navigate to `/match`

2. **Match Feed** (`/match`):
   - View card stack of potential matches (online only)
   - Swipe through profiles
   - Press "Connect" or "Skip"
   - If mutual match: Navigate to chat room

3. **Chat** (`/chat/[id]`):
   - Real-time messaging
   - End conversation (marks match as 'ended')
   - Add to community

---

## CURRENT LIMITATIONS & FUTURE ENHANCEMENTS

### Current Limitations
1. **No Personality-Based Matching**: Embeddings collected but not used in feed
2. **No Skip Tracking**: Skipped users can appear again
3. **No Time Limit Enforcement**: Selected time limit not enforced in chat
4. **No Topic Enforcement**: Selected topic not passed to match

### Future Enhancements
1. **Personality Similarity Boost**: Add cosine similarity scoring to match feed
2. **Skip History**: Track skipped users to avoid showing again
3. **Time Limit Enforcement**: Auto-end chat after selected time limit
4. **Topic-Based Chat**: Pre-populate chat with topic context
5. **Mutual Friends/Communities**: Calculate and display actual mutual connections
6. **Reputation System**: Use reputation_emojis for matching preferences

---

## CRITICAL BUSINESS RULES

1. **ONLINE-ONLY MATCHING**: Match feed MUST only return users with `is_online = true` AND `last_seen_at` within 5 minutes. No exceptions.

2. **MUTUAL MATCH REQUIRED**: A match only occurs when BOTH users press "Connect" on each other. Single-sided connections remain "pending".

3. **NO REMATCHING**: Users who have already matched (in `chat_matches` with `status = 'active'`) are excluded from feed.

4. **PENDING CONNECTIONS**: Users with pending connections (in `match_queue` with `status = 'pending'`) are excluded from feed.

5. **MOOD SELECTION REQUIRED**: Users must select a mood on profile page before navigating away (enforced client-side).

---

## ENVIRONMENT VARIABLES

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (optional, for personality matching)
OPENAI_API_KEY=sk-...

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## FILE STRUCTURE

```
app/
  ├── api/
  │   ├── match/
  │   │   ├── feed/route.ts          # Match feed generation
  │   │   ├── connect/route.ts       # Connect action (mutual match detection)
  │   │   └── skip/route.ts          # Skip action
  │   ├── friends/
  │   │   ├── online/route.ts        # Online friends by tier
  │   │   └── offline/route.ts       # Offline friends for invite
  │   ├── matches/route.ts           # Match CRUD operations
  │   └── users/route.ts             # User profile CRUD
  ├── match/page.tsx                 # Card stack matching UI
  ├── topic-match/page.tsx           # Topic selection + match overview
  ├── invite/page.tsx                # Invite offline friends
  └── profile/page.tsx               # User profile with mood selector

components/
  ├── match/
  │   ├── CardStack.tsx              # Card stack container
  │   └── MatchCard.tsx              # Individual match card UI
  └── ui/
      └── toast.tsx                   # Internal notification system

lib/
  ├── ai/
  │   └── openai-service.ts          # OpenAI integration (personality)
  └── supabaseClient.ts              # Supabase client factory
```

---

## TESTING SCENARIOS

### Match Feed
1. **No Online Users**: Should return empty array `[]`
2. **All Users Matched**: Should return empty array `[]`
3. **Mood/Topic Match**: Should prioritize users with matching mood/topic
4. **Fallback**: Should return any online users if no mood/topic match

### Connection Flow
1. **Single Connect**: User A connects with User B → Status: `pending`
2. **Mutual Connect**: User B connects with User A → Status: `matched`, creates `chat_matches` and `chats`
3. **Duplicate Connect**: User A connects again → Should return existing connection
4. **Self Connect**: Should reject with error

### Presence System
1. **Online Check**: User with `is_online = true` and `last_seen_at` within 5 min → Included
2. **Offline Check**: User with `is_online = false` or `last_seen_at` > 5 min → Excluded
3. **Stale Entry**: User offline for > 5 min → Filtered out in queries

---

## DEPLOYMENT NOTES

- **Vercel**: Automatic deployments on git push
- **Supabase**: Migrations run via Supabase CLI or dashboard
- **Environment Variables**: Must be set in Vercel dashboard
- **Database**: PostgreSQL 15+ with pgvector extension
- **Realtime**: Enabled for `user_presence`, `notifications`, `messages`

---

## VERSION HISTORY

- **v2.0** (Current): Tinder-style card stack matching, online-only requirement, mood-based matching
- **v1.0**: Old waiting pool system (deprecated)

---

**Last Updated**: 2025-01-XX
**Maintained By**: Development Team
**Contact**: [Your contact info]

