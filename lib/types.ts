export type IntimacyTier = 'inner-circle' | 'close-friends' | 'community'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  bio?: string
  location?: string
  website?: string
  intimacyTier: IntimacyTier
  stats?: {
    connections: number
    topics: number
    moods: number
  }
}

// Vibe interface removed - using mood in users table instead
// Keeping for backward compatibility with VIBES constant (will be removed later)
export interface Vibe {
  id: string
  label: string
  icon: string
  color: string
  description?: string
}

export interface Topic {
  id: string
  label: string
  icon: string
  description?: string
  category?: 'news' | 'pop-culture' | 'general' | 'sports'
}

export interface Match {
  id: string
  user: User
  mood: string
  topic: string
  compatibility: number
  intimacyTier: IntimacyTier
}

export interface Message {
  id: string
  senderId: string
  content: string
  timestamp: Date
  read: boolean
  readAt?: Date | null
  reactions?: Record<string, string[]> // { "👍": ["user1", "user2"], "❤️": ["user3"] }
  messageType?: 'text' | 'image' | 'file'
  fileUrl?: string | null
  fileName?: string | null
  fileSize?: number | null
}

export interface Chat {
  id: string
  matchId: string
  userId: string
  matchUserId: string
  messages: Message[]
  lastMessageAt: Date
  intimacyTier: IntimacyTier
}

export interface CalendarEvent {
  id: string
  title: string
  date: Date
  time?: string
  description?: string
  participants: string[]
  intimacyTier: IntimacyTier
}

export interface FeedbackSubmission {
  id?: string
  name?: string
  email?: string
  category: 'general' | 'bug' | 'feature' | 'other'
  message: string
  submittedAt?: Date
}

