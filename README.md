# Narrative - Social Connection App

A modern social connection app built with Next.js 14, featuring a clean, futuristic OpenAI/Apple-like design aesthetic.

## Tech Stack

- **Next.js 14** with App Router and React Server Components
- **TypeScript** for type safety
- **TailwindCSS** (installed via build tool)
- **shadcn/ui** for UI components
- **Framer Motion** for animations
- **Supabase** (installed, not yet configured)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Install dependencies:
```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

## Project Structure

```
narrative/
├── app/
│   ├── calendar/        # Calendar page
│   ├── chat/            # Chat page
│   ├── connect/         # Connect page
│   ├── login/           # Login page
│   ├── profile/         # Profile page
│   ├── topic/           # Topic page
│   ├── vibe/            # Vibe page
│   ├── globals.css      # Global styles with Tailwind
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page
├── components/          # UI components (for shadcn/ui)
├── lib/
│   └── utils.ts         # Utility functions
├── public/              # Static assets
└── package.json
```

## Pages

- `/` - Home page
- `/login` - Login/Sign up page
- `/vibe` - Share your current energy
- `/topic` - Explore conversations by theme
- `/connect` - Discover people with similar interests
- `/chat` - Your conversations
- `/calendar` - Upcoming events and connections
- `/profile` - User profile page

## Styling

The app uses TailwindCSS with a custom color scheme inspired by modern design systems. All pages feature:
- Gradient backgrounds
- Backdrop blur effects
- Smooth animations via Framer Motion
- Dark mode support
- Responsive design

## Next Steps

- Configure Supabase for authentication and database
- Add authentication flow
- Implement real-time features
- Connect to backend APIs

