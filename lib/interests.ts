// Interest options for November 2025
export interface Interest {
  id: string
  label: string
  category: string
  emoji?: string
}

export const INTEREST_CATEGORIES = {
  SPORTS: 'Sports',
  UFC: 'UFC/Combat Sports',
  POLITICS: 'Politics',
  ENTERTAINMENT: 'Entertainment',
  TECHNOLOGY: 'Technology',
  OTHER: 'Other',
} as const

export const INTERESTS: Interest[] = [
  // Sports
  { id: 'nfl-season', label: 'NFL Season', category: INTEREST_CATEGORIES.SPORTS, emoji: '🏈' },
  { id: 'college-football', label: 'College Football Playoff', category: INTEREST_CATEGORIES.SPORTS, emoji: '🏈' },
  { id: 'nba-season', label: 'NBA Season', category: INTEREST_CATEGORIES.SPORTS, emoji: '🏀' },
  { id: 'mlb-world-series', label: 'MLB World Series', category: INTEREST_CATEGORIES.SPORTS, emoji: '⚾' },
  { id: 'formula-1', label: 'Formula 1 Racing', category: INTEREST_CATEGORIES.SPORTS, emoji: '🏎️' },
  { id: 'tennis', label: 'Tennis (ATP/WTA Finals)', category: INTEREST_CATEGORIES.SPORTS, emoji: '🎾' },
  
  // UFC/Combat Sports
  { id: 'ufc-events', label: 'UFC 2025 Events', category: INTEREST_CATEGORIES.UFC, emoji: '🥊' },
  { id: 'mma-championships', label: 'MMA Championships', category: INTEREST_CATEGORIES.UFC, emoji: '🥋' },
  { id: 'boxing', label: 'Boxing Matches', category: INTEREST_CATEGORIES.UFC, emoji: '👊' },
  { id: 'combat-sports-news', label: 'Combat Sports News', category: INTEREST_CATEGORIES.UFC, emoji: '📰' },
  
  // Politics
  { id: 'elections-2025', label: '2025 Elections', category: INTEREST_CATEGORIES.POLITICS, emoji: '🗳️' },
  { id: 'political-news', label: 'Political News', category: INTEREST_CATEGORIES.POLITICS, emoji: '📰' },
  { id: 'policy-discussions', label: 'Policy Discussions', category: INTEREST_CATEGORIES.POLITICS, emoji: '💼' },
  { id: 'international-relations', label: 'International Relations', category: INTEREST_CATEGORIES.POLITICS, emoji: '🌍' },
  { id: 'local-politics', label: 'Local Politics', category: INTEREST_CATEGORIES.POLITICS, emoji: '🏛️' },
  
  // Entertainment
  { id: 'movies-tv', label: 'Movies & TV Shows', category: INTEREST_CATEGORIES.ENTERTAINMENT, emoji: '🎬' },
  { id: 'music-releases', label: 'Music Releases', category: INTEREST_CATEGORIES.ENTERTAINMENT, emoji: '🎵' },
  { id: 'gaming', label: 'Gaming', category: INTEREST_CATEGORIES.ENTERTAINMENT, emoji: '🎮' },
  { id: 'pop-culture', label: 'Pop Culture', category: INTEREST_CATEGORIES.ENTERTAINMENT, emoji: '⭐' },
  { id: 'streaming-content', label: 'Streaming Content', category: INTEREST_CATEGORIES.ENTERTAINMENT, emoji: '📺' },
  
  // Technology
  { id: 'ai-ml', label: 'AI & Machine Learning', category: INTEREST_CATEGORIES.TECHNOLOGY, emoji: '🤖' },
  { id: 'tech-news', label: 'Tech News', category: INTEREST_CATEGORIES.TECHNOLOGY, emoji: '💻' },
  { id: 'software-dev', label: 'Software Development', category: INTEREST_CATEGORIES.TECHNOLOGY, emoji: '⌨️' },
  { id: 'gadgets-reviews', label: 'Gadgets & Reviews', category: INTEREST_CATEGORIES.TECHNOLOGY, emoji: '📱' },
  
  // Other
  { id: 'business-finance', label: 'Business & Finance', category: INTEREST_CATEGORIES.OTHER, emoji: '💼' },
  { id: 'health-wellness', label: 'Health & Wellness', category: INTEREST_CATEGORIES.OTHER, emoji: '🧘' },
  { id: 'travel', label: 'Travel', category: INTEREST_CATEGORIES.OTHER, emoji: '✈️' },
  { id: 'food-cooking', label: 'Food & Cooking', category: INTEREST_CATEGORIES.OTHER, emoji: '🍳' },
  { id: 'fashion-style', label: 'Fashion & Style', category: INTEREST_CATEGORIES.OTHER, emoji: '👗' },
]

// Helper function to get interests by category
export function getInterestsByCategory(category: string): Interest[] {
  return INTERESTS.filter(interest => interest.category === category)
}

// Helper function to get all categories
export function getAllCategories(): string[] {
  return Object.values(INTEREST_CATEGORIES)
}

// Helper function to get interest by ID
export function getInterestById(id: string): Interest | undefined {
  return INTERESTS.find(interest => interest.id === id)
}

