export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          created_at?: string
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
          created_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          topic?: string | null
          status?: 'pending' | 'active' | 'ended'
          created_at?: string
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          topic?: string | null
          status?: 'pending' | 'active' | 'ended'
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

