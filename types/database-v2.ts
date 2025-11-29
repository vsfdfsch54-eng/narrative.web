/**
 * Narrative V2.0 Database Types
 * TypeScript types for the new V2 schema
 */

export type VisibilityLayer = 'private' | 'close-friends' | 'inner-circle' | 'community' | 'public'
export type LoopRole = 'owner' | 'admin' | 'member'
export type EventParticipantStatus = 'invited' | 'accepted' | 'declined' | 'maybe'
export type MatchmakingStatus = 'pending' | 'preview' | 'ephemeral_chat' | 'messaging_only' | 'matched' | 'dissolved' | 'blocked'
export type SwipeDirection = 'left' | 'right'
export type SafetyFlagType = 'harassment' | 'hate' | 'inappropriate' | 'safety_risk'
export type SafetySeverity = 'low' | 'medium' | 'high' | 'critical'
export type SafetyStatus = 'pending' | 'reviewed' | 'resolved' | 'escalated'
export type FeedbackType = 'user' | 'loop' | 'event' | 'matchmaking' | 'call'
export type AISignalType = 
  | 'mood_chosen'
  | 'intention_chosen'
  | 'topic_chosen'
  | 'swipe_pattern'
  | 'chat_duration'
  | 'stay_connected'
  | 'loop_activity'
  | 'call_duration'
  | 'call_extension'
  | 'event_attendance'
  | 'visibility_change'
  | 'growth_toggle'
  | 'safety_signal'

export interface Loop {
  id: string
  title: string
  visibility_layer: VisibilityLayer
  growth_enabled: boolean
  past_activity_enabled: boolean
  feed_sync_enabled: boolean
  private_link: string | null
  created_at: string
  updated_at: string
}

export interface LoopParticipant {
  loop_id: string
  user_id: string
  role: LoopRole
  joined_at: string
}

export interface Event {
  id: string
  loop_id: string | null
  title: string
  date_time: string
  location: string | null
  visibility_layer: VisibilityLayer
  growth_enabled: boolean
  participant_list_visible: boolean
  past_activity_enabled: boolean
  sync_to_feed: boolean
  private_link: string | null
  guest_mode_enabled: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface EventParticipant {
  event_id: string
  user_id: string
  status: EventParticipantStatus
  joined_at: string | null
  created_at: string
}

export interface MatchmakingSession {
  id: string
  user1_id: string
  user2_id: string
  mood: string
  intention: string
  topic: string
  match_score: number | null
  status: MatchmakingStatus
  preview_started_at: string | null
  ephemeral_chat_duration: number | null
  user1_swipe: SwipeDirection | null
  user2_swipe: SwipeDirection | null
  stay_connected_at: string | null
  created_at: string
  updated_at: string
}

export interface LoopMessage {
  id: string
  loop_id: string
  sender_id: string
  text: string
  created_at: string
}

export interface AISignal {
  id: string
  user_id: string
  signal_type: AISignalType
  signal_data: Record<string, any> // JSONB - behavior data only, no content
  created_at: string
}

export interface SafetyFlag {
  id: string
  user_id: string
  flagged_user_id: string
  flag_type: SafetyFlagType
  severity: SafetySeverity
  status: SafetyStatus
  notes: string | null
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
}

export interface Feedback {
  id: string
  user_id: string
  target_id: string | null
  feedback_type: FeedbackType
  notes: string | null
  created_at: string
}

// Database schema type (for Supabase)
export interface DatabaseV2 {
  public: {
    Tables: {
      loops: {
        Row: Loop
        Insert: Omit<Loop, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Loop, 'id' | 'created_at'>>
      }
      loop_participants: {
        Row: LoopParticipant
        Insert: Omit<LoopParticipant, 'joined_at'>
        Update: Partial<Omit<LoopParticipant, 'joined_at'>>
      }
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Event, 'id' | 'created_at'>>
      }
      event_participants: {
        Row: EventParticipant
        Insert: Omit<EventParticipant, 'created_at'>
        Update: Partial<Omit<EventParticipant, 'created_at'>>
      }
      matchmaking_sessions: {
        Row: MatchmakingSession
        Insert: Omit<MatchmakingSession, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<MatchmakingSession, 'id' | 'created_at'>>
      }
      loop_messages: {
        Row: LoopMessage
        Insert: Omit<LoopMessage, 'id' | 'created_at'>
        Update: Partial<Omit<LoopMessage, 'id' | 'created_at'>>
      }
      ai_signals: {
        Row: AISignal
        Insert: Omit<AISignal, 'id' | 'created_at'>
        Update: Partial<Omit<AISignal, 'id' | 'created_at'>>
      }
      safety_flags: {
        Row: SafetyFlag
        Insert: Omit<SafetyFlag, 'id' | 'created_at' | 'reviewed_at' | 'reviewed_by'>
        Update: Partial<Omit<SafetyFlag, 'id' | 'created_at'>>
      }
      feedback: {
        Row: Feedback
        Insert: Omit<Feedback, 'id' | 'created_at'>
        Update: Partial<Omit<Feedback, 'id' | 'created_at'>>
      }
    }
  }
}

