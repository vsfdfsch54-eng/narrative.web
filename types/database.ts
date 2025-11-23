export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Personality-related types
export type PersonalityEmbedding = number[] // Vector of 1536 numbers for OpenAI text-embedding-3-large

export interface PersonalityTraits {
  bigFive?: {
    openness: number // 0.0 to 1.0
    conscientiousness: number
    extraversion: number
    agreeableness: number
    neuroticism: number
  }
  communicationStyle?: 'direct' | 'indirect' | 'balanced'
  socialEnergy?: 'introvert' | 'extrovert' | 'ambivert'
  conversationDepth?: 'deep' | 'light' | 'balanced'
  emotionalOpenness?: 'open' | 'reserved' | 'balanced'
  socialIntention?: string[] // Array of: 'venting', 'learning', 'humor', 'connection'
}

export interface WaitingPoolUser {
  id: string
  user_id: string
  embedding: PersonalityEmbedding
  created_at: string
}

export interface MatchScore {
  score: number // 0.0 to 1.0
  embeddingSimilarity: number
  traitBonus: number
}

export interface OnboardingResponse {
  id: string
  user_id: string
  responses: Record<string, any> // Questionnaire answers
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          interests: string[] | null
          personality_embedding: number[] | string | null
          personality_summary: string | null
          traits: Json | null
          bio: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          email: string
          name: string
          avatar_url?: string | null
          interests?: string[] | null
          personality_embedding?: number[] | string | null
          personality_summary?: string | null
          traits?: Json | null
          bio?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          interests?: string[] | null
          personality_embedding?: number[] | string | null
          personality_summary?: string | null
          traits?: Json | null
          bio?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      waiting_pool: {
        Row: {
          id: string
          user_id: string
          embedding: number[] | string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          embedding: number[] | string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          embedding?: number[] | string
          created_at?: string
        }
      }
      onboarding_responses: {
        Row: {
          id: string
          user_id: string
          responses: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          responses: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          responses?: Json
          created_at?: string
          updated_at?: string
        }
      }
      vibes: {
        Row: {
          id: string
          user_id: string
          vibe: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          vibe: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          vibe?: string
          created_at?: string
        }
      }
      topics: {
        Row: {
          id: string
          label: string
          emoji: string | null
          blurb: string | null
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          label: string
          emoji?: string | null
          blurb?: string | null
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          label?: string
          emoji?: string | null
          blurb?: string | null
          category?: string | null
          created_at?: string
        }
      }
      chat_matches: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          topic: string | null
          status: 'pending' | 'active' | 'ended'
          match_score: number | null
          traits_used: Json | null
          user1_vibe: string | null
          user1_topic: string | null
          user1_timeframe: number | null
          user2_vibe: string | null
          user2_topic: string | null
          user2_timeframe: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          topic?: string | null
          status?: 'pending' | 'active' | 'ended'
          match_score?: number | null
          traits_used?: Json | null
          user1_vibe?: string | null
          user1_topic?: string | null
          user1_timeframe?: number | null
          user2_vibe?: string | null
          user2_topic?: string | null
          user2_timeframe?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          topic?: string | null
          status?: 'pending' | 'active' | 'ended'
          match_score?: number | null
          traits_used?: Json | null
          user1_vibe?: string | null
          user1_topic?: string | null
          user1_timeframe?: number | null
          user2_vibe?: string | null
          user2_topic?: string | null
          user2_timeframe?: number | null
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          match_id: string
          sender_id: string
          text: string
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          sender_id: string
          text: string
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          sender_id?: string
          text?: string
          created_at?: string
        }
      }
      calendar_events: {
        Row: {
          id: string
          user_id: string
          day: number
          title: string
          location: string | null
          time_slot: string | null
          group_type: 'inner' | 'close' | 'community' | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          day: number
          title: string
          location?: string | null
          time_slot?: string | null
          group_type?: 'inner' | 'close' | 'community' | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          day?: number
          title?: string
          location?: string | null
          time_slot?: string | null
          group_type?: 'inner' | 'close' | 'community' | null
          created_at?: string
        }
      }
      feedback: {
        Row: {
          id: string
          match_id: string
          user_id: string
          emoji: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          user_id: string
          emoji?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          user_id?: string
          emoji?: string | null
          notes?: string | null
          created_at?: string
        }
      }
    }
  }
}

