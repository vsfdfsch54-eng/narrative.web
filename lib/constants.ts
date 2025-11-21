import { Vibe, Topic, IntimacyTier } from './types'

export const VIBES: Vibe[] = [
  { id: 'creative', label: 'Creative Flow', icon: '✨', color: 'purple', description: 'Feeling inspired and artistic' },
  { id: 'focused', label: 'Focused Energy', icon: '🎯', color: 'blue', description: 'Deep work mode activated' },
  { id: 'social', label: 'Social Butterfly', icon: '🦋', color: 'pink', description: 'Ready to connect' },
  { id: 'chill', label: 'Chill Vibes', icon: '🌊', color: 'cyan', description: 'Relaxed and peaceful' },
  { id: 'adventure', label: 'Adventure Mode', icon: '🚀', color: 'orange', description: 'Seeking new experiences' },
  { id: 'reflective', label: 'Reflective Mood', icon: '🤔', color: 'indigo', description: 'Time for introspection' },
  { id: 'energetic', label: 'Energetic', icon: '⚡', color: 'yellow', description: 'High energy and excitement' },
  { id: 'curious', label: 'Curious', icon: '🔍', color: 'green', description: 'Eager to learn and explore' },
]

// News Topics (2025)
export const NEWS_TOPICS: Topic[] = [
  { id: 'us-election-cycle', label: 'US Election Cycle', icon: '🗳️', category: 'news' },
  { id: 'ai-safety-regulations', label: 'AI Safety Regulations', icon: '🤖', category: 'news' },
  { id: 'crypto-market-surge', label: 'Crypto Market Surge', icon: '₿', category: 'news' },
  { id: 'climate-events-2025', label: 'Climate Events 2025', icon: '🌱', category: 'news' },
  { id: 'global-tech-layoffs', label: 'Global Tech Layoffs', icon: '💻', category: 'news' },
]

// Pop Culture Topics (2025)
export const POP_CULTURE_TOPICS: Topic[] = [
  { id: 'coachella-2025', label: 'Coachella 2025', icon: '🎵', category: 'pop-culture' },
  { id: 'tiktok-trends', label: 'TikTok Trends', icon: '📱', category: 'pop-culture' },
  { id: 'taylor-swift-mirrorball', label: 'Taylor Swift Mirrorball Tour', icon: '✨', category: 'pop-culture' },
  { id: 'ufc-306', label: 'UFC 306', icon: '🥊', category: 'pop-culture' },
  { id: 'iphone-17-leaks', label: 'New iPhone 17 leaks', icon: '📱', category: 'pop-culture' },
]

// General Topics (2025)
export const GENERAL_TOPICS: Topic[] = [
  { id: 'advice', label: 'Advice', icon: '💡', category: 'general' },
  { id: 'life', label: 'Life', icon: '🌍', category: 'general' },
  { id: 'random', label: 'Random', icon: '🎲', category: 'general' },
  { id: 'relationships', label: 'Relationships', icon: '💕', category: 'general' },
]

// Sports Topics (2025)
export const SPORTS_TOPICS: Topic[] = [
  { id: 'sports', label: 'Sports', icon: '⚽', category: 'sports' },
]

// All topics combined
export const TOPICS: Topic[] = [
  ...NEWS_TOPICS,
  ...POP_CULTURE_TOPICS,
  ...GENERAL_TOPICS,
  ...SPORTS_TOPICS,
]

export const INTIMACY_TIERS: { id: IntimacyTier; label: string; color: string; description: string }[] = [
  { id: 'inner-circle', label: 'Inner Circle', color: 'gold', description: 'Most intimate, closest connections' },
  { id: 'close-friends', label: 'Close Friends', color: 'blue', description: 'Regular connections, trusted' },
  { id: 'community', label: 'Community', color: 'gray', description: 'Broader network, public interactions' },
]

export const FEEDBACK_CATEGORIES = [
  { id: 'general', label: 'General Feedback' },
  { id: 'bug', label: 'Bug Report' },
  { id: 'feature', label: 'Feature Request' },
  { id: 'other', label: 'Other' },
] as const

