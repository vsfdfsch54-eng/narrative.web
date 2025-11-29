# Narrative V2.0 - Social Connection App

A modern social connection app built with Next.js 15, featuring a clean, premium design and a new architecture focused on Loops, Events, and Matchmaking.

## Tech Stack

- **Next.js 15** with App Router and React Server Components
- **TypeScript** for type safety
- **TailwindCSS** for styling
- **Framer Motion** for animations
- **Supabase** for database, auth, and realtime
- **OpenAI** for AI-powered features

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account and project

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

3. Run database migrations:
   - Go to Supabase SQL Editor
   - Run `supabase/migrations/036_narrative_v2_schema.sql`

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
narrative/
├── app/
│   ├── onboarding-v2/     # V2 onboarding flow (10 steps)
│   ├── home-v2/           # V2 home page
│   ├── match-v2/          # V2 matchmaking flow
│   ├── loops/             # Loops (persistent connections)
│   ├── events/            # Events (calendar & gatherings)
│   ├── profile-v2/        # V2 profile page
│   ├── messaging-only/    # Messaging-only state
│   ├── api/               # API routes
│   │   ├── loops/         # Loop CRUD & messaging
│   │   ├── events/        # Event CRUD & participants
│   │   ├── matchmaking-v2/# Matchmaking system
│   │   └── onboarding-v2/ # Onboarding completion
│   └── globals.css        # Global styles
├── components/
│   ├── onboarding-v2/    # Onboarding step components
│   ├── match-v2/          # Matchmaking step components
│   └── ui/                # Shared UI components
├── context/
│   ├── OnboardingV2Context.tsx
│   ├── MatchmakingContext.tsx
│   ├── LoopsContext.tsx
│   └── EventsContext.tsx
├── lib/
│   ├── loops-helpers.ts   # Loop helper functions
│   ├── events-helpers.ts  # Event helper functions
│   ├── matchmaking-scorer.ts
│   ├── matchmaking-state-machine.ts
│   └── design-tokens-v2.ts
├── types/
│   └── database-v2.ts     # V2 database types
└── supabase/
    └── migrations/
        └── 036_narrative_v2_schema.sql
```

## V2 Architecture

### Core Concepts

1. **Loops** - The only relational container
   - Persistent messaging
   - Visibility layers (private, close-friends, inner-circle, community, public)
   - Growth enabled/disabled
   - Private links for bypassing visibility

2. **Events** - Calendar-based gatherings
   - Associated with Loops (optional)
   - Participant management
   - RSVP system
   - Visibility hierarchy (Event >= Loop)

3. **Matchmaking** - Mood → Intention → Topic → Preview → Ephemeral Chat → Swipe
   - Ephemeral chat (never stored)
   - Dual right swipe → Messaging-only connection
   - Single right swipe → Messaging-only state
   - Left swipe → Dissolved

4. **Onboarding** - 10-step flow
   - Welcome → Create Account → Nickname → Profile Basics
   - Mood Preferences → Intention Preferences → Topic Preferences
   - How It Works → Permissions → You're In

## Pages

### V2 Pages
- `/` - Root (redirects based on auth/onboarding status)
- `/onboarding-v2` - V2 onboarding flow
- `/home-v2` - V2 home page
- `/match-v2` - V2 matchmaking flow
- `/loops` - Loops list
- `/loops/[id]` - Individual loop with messaging
- `/events` - Events list
- `/events/[id]` - Individual event details
- `/profile-v2` - V2 profile page
- `/messaging-only/[sessionId]` - Messaging-only connection state

### Legacy Pages (Still functional)
- `/login` - Login page
- `/profile` - Legacy profile (uses old design tokens)
- `/calendar` - Legacy calendar
- `/conversations` - Legacy conversations
- `/notifications` - Notifications
- `/invite` - Invite friends

## API Routes

### V2 API Routes
- `POST /api/loops` - Create loop
- `GET /api/loops?userId=UUID` - Get user's loops
- `GET /api/loops/[id]?userId=UUID` - Get loop details
- `POST /api/loops/[id]/messages` - Send message
- `GET /api/loops/[id]/messages` - Get messages
- `POST /api/loops/[id]/participants` - Add participant
- `DELETE /api/loops/[id]/participants?userId=UUID` - Remove participant
- `GET /api/loops/[id]/participants` - Get participants

- `POST /api/events` - Create event
- `GET /api/events?userId=UUID` - Get user's events
- `GET /api/events/[id]?userId=UUID` - Get event details
- `POST /api/events/[id]/participants` - Invite/update participant status
- `GET /api/events/[id]/participants` - Get participants

- `POST /api/matchmaking-v2/find` - Find matches
- `GET /api/matchmaking-v2/session/[sessionId]` - Get session
- `POST /api/matchmaking-v2/session/[sessionId]/swipe` - Record swipe
- `GET /api/matchmaking-v2/session/[sessionId]/swipe-status` - Check swipe status

- `POST /api/onboarding-v2/complete` - Complete onboarding

## Design System

The app uses a modern, minimal design system defined in `lib/design-tokens-v2.ts`:

- **Colors**: Gradient primary (#004FFF → #6D00FF), accent colors, eggshell background
- **Typography**: Inter font family, clear hierarchy
- **Spacing**: Consistent 4px base unit
- **Border Radius**: 14px for cards, full for pills
- **Shadows**: Subtle, layered shadows
- **Animations**: Smooth transitions via Framer Motion

## Database Schema

See `supabase/migrations/036_narrative_v2_schema.sql` for the complete schema.

Key tables:
- `loops` - Loop containers
- `loop_participants` - Loop membership
- `loop_messages` - Persistent messages in loops
- `events` - Calendar events
- `event_participants` - Event RSVPs
- `matchmaking_sessions` - Matchmaking state
- `ai_signals` - Behavioral data (no content)
- `safety_flags` - Moderation flags

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run clean` - Clean .next and node_modules, reinstall
- `npm run dev-clean` - Kill Next.js, clean .next, start dev

## Migration from V1

Users with `schema_version = 'v1'` will be redirected to `/onboarding-v2` to complete V2 onboarding. This sets `schema_version = 'v2'` and `onboarding_completed = true`.

## License

Private - All rights reserved
