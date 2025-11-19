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

// News Topics
export const NEWS_TOPICS: Topic[] = [
  { id: 'news', label: 'News', icon: '📰', category: 'news' },
  { id: 'trending', label: "What's Trending", icon: '🔥', category: 'news' },
  { id: 'current-events', label: 'Current Events', icon: '🌍', category: 'news' },
  { id: 'breaking-news', label: 'Breaking News', icon: '⚡', category: 'news' },
  { id: 'world-news', label: 'World News', icon: '🌎', category: 'news' },
  { id: 'tech-news', label: 'Tech News', icon: '💻', category: 'news' },
  { id: 'ai-chatgpt', label: 'AI & ChatGPT', icon: '🤖', category: 'news' },
  { id: 'climate', label: 'Climate Change', icon: '🌱', category: 'news' },
  { id: 'elections', label: 'Elections 2024', icon: '🗳️', category: 'news' },
  { id: 'crypto', label: 'Crypto & Web3', icon: '₿', category: 'news' },
  { id: 'sustainability', label: 'Sustainability', icon: '♻️', category: 'news' },
]

// Pop Culture Topics
export const POP_CULTURE_TOPICS: Topic[] = [
  { id: 'pop-culture', label: 'Pop Culture', icon: '⭐', category: 'pop-culture' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬', category: 'pop-culture' },
  { id: 'celebrities', label: 'Celebrities', icon: '✨', category: 'pop-culture' },
  { id: 'movies', label: 'Movies', icon: '🎥', category: 'pop-culture' },
  { id: 'tv-shows', label: 'TV Shows', icon: '📺', category: 'pop-culture' },
  { id: 'music-pop', label: 'Music', icon: '🎵', category: 'pop-culture' },
  { id: 'fashion', label: 'Fashion', icon: '👗', category: 'pop-culture' },
  { id: 'social-media', label: 'Social Media Trends', icon: '📱', category: 'pop-culture' },
  { id: 'tiktok', label: 'TikTok Trends', icon: '🎵', category: 'pop-culture' },
  { id: 'streaming', label: 'Streaming Wars', icon: '📺', category: 'pop-culture' },
  { id: 'gaming-pop', label: 'Gaming Culture', icon: '🎮', category: 'pop-culture' },
  { id: 'memes', label: 'Memes & Viral', icon: '😂', category: 'pop-culture' },
]

// General Topics
export const GENERAL_TOPICS: Topic[] = [
  { id: 'technology', label: 'Technology', icon: '💻', category: 'general' },
  { id: 'art-design', label: 'Art & Design', icon: '🎨', category: 'general' },
  { id: 'science', label: 'Science', icon: '🔬', category: 'general' },
  { id: 'philosophy', label: 'Philosophy', icon: '🤔', category: 'general' },
  { id: 'travel', label: 'Travel', icon: '✈️', category: 'general' },
  { id: 'literature', label: 'Literature', icon: '📚', category: 'general' },
  { id: 'food-culture', label: 'Food & Culture', icon: '🍜', category: 'general' },
  { id: 'sports', label: 'Sports', icon: '⚽', category: 'general' },
  { id: 'gaming', label: 'Gaming', icon: '🎮', category: 'general' },
  { id: 'photography', label: 'Photography', icon: '📸', category: 'general' },
  { id: 'wellness', label: 'Wellness', icon: '🧘', category: 'general' },
]

// All topics combined
export const TOPICS: Topic[] = [
  ...NEWS_TOPICS,
  ...POP_CULTURE_TOPICS,
  ...GENERAL_TOPICS,
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

