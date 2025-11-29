/**
 * Interest options organized by category
 * Categories: Trending, For Men, For Women
 */

export interface Interest {
  id: string
  label: string
  category: 'trending' | 'men' | 'women'
  emoji?: string
}

export const INTEREST_CATEGORIES = {
  TRENDING: 'trending' as const,
  MEN: 'men' as const,
  WOMEN: 'women' as const,
} as const

export const INTERESTS: Interest[] = [
  // Trending
  { id: 'ai-ml', label: 'AI & Machine Learning', category: 'trending', emoji: '🤖' },
  { id: 'crypto', label: 'Crypto & Web3', category: 'trending', emoji: '₿' },
  { id: 'sustainability', label: 'Sustainability & Climate', category: 'trending', emoji: '🌱' },
  { id: 'mental-health', label: 'Mental Health & Wellness', category: 'trending', emoji: '🧘' },
  { id: 'remote-work', label: 'Remote Work & Digital Nomad', category: 'trending', emoji: '💻' },
  { id: 'fitness-tech', label: 'Fitness Technology', category: 'trending', emoji: '⌚' },
  { id: 'streaming', label: 'Streaming & Content Creation', category: 'trending', emoji: '📺' },
  { id: 'nft-art', label: 'NFT & Digital Art', category: 'trending', emoji: '🎨' },
  
  // For Men
  { id: 'nfl', label: 'NFL', category: 'men', emoji: '🏈' },
  { id: 'nba', label: 'NBA', category: 'men', emoji: '🏀' },
  { id: 'ufc', label: 'UFC & MMA', category: 'men', emoji: '🥊' },
  { id: 'gaming', label: 'Gaming', category: 'men', emoji: '🎮' },
  { id: 'cars', label: 'Cars & Automotive', category: 'men', emoji: '🚗' },
  { id: 'tech-gadgets', label: 'Tech & Gadgets', category: 'men', emoji: '📱' },
  { id: 'investing', label: 'Investing & Finance', category: 'men', emoji: '📈' },
  { id: 'fitness', label: 'Fitness & Bodybuilding', category: 'men', emoji: '💪' },
  { id: 'politics', label: 'Politics & Current Events', category: 'men', emoji: '🗳️' },
  { id: 'business', label: 'Business & Entrepreneurship', category: 'men', emoji: '💼' },
  
  // For Women
  { id: 'fashion', label: 'Fashion & Style', category: 'women', emoji: '👗' },
  { id: 'beauty', label: 'Beauty & Skincare', category: 'women', emoji: '💄' },
  { id: 'wellness', label: 'Wellness & Self-Care', category: 'women', emoji: '✨' },
  { id: 'relationships', label: 'Relationships & Dating', category: 'women', emoji: '💕' },
  { id: 'parenting', label: 'Parenting & Family', category: 'women', emoji: '👶' },
  { id: 'home-decor', label: 'Home Decor & Interior Design', category: 'women', emoji: '🏠' },
  { id: 'cooking', label: 'Cooking & Recipes', category: 'women', emoji: '🍳' },
  { id: 'books', label: 'Books & Reading', category: 'women', emoji: '📚' },
  { id: 'travel', label: 'Travel & Adventure', category: 'women', emoji: '✈️' },
  { id: 'yoga', label: 'Yoga & Mindfulness', category: 'women', emoji: '🧘' },
]

/**
 * Get interests by category
 */
export function getInterestsByCategory(category: 'trending' | 'men' | 'women'): Interest[] {
  return INTERESTS.filter(interest => interest.category === category)
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
  return ['trending', 'men', 'women']
}

/**
 * Get interest by ID
 */
export function getInterestById(id: string): Interest | undefined {
  return INTERESTS.find(interest => interest.id === id)
}
