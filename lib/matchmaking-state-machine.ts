/**
 * Matchmaking State Machine
 * Manages the flow: mood → intention → topic → preview → ephemeral chat → swipe
 */

export type MatchmakingState = 
  | 'mood'
  | 'intention'
  | 'topic'
  | 'finding'
  | 'preview'
  | 'ephemeral_chat'
  | 'swipe_result'
  | 'messaging_only'
  | 'matched'
  | 'dissolved'

export interface MatchmakingContext {
  state: MatchmakingState
  mood: string | null
  intention: string | null
  topic: string | null
  matchSessionId: string | null
  matchedUserId: string | null
  previewStartedAt: Date | null
  ephemeralChatMessages: Array<{ id: string; text: string; senderId: string; timestamp: Date }>
  swipeDirection: 'left' | 'right' | null
  otherUserSwipe: 'left' | 'right' | null
}

export const MATCHMAKING_STATE_TRANSITIONS: Record<MatchmakingState, MatchmakingState[]> = {
  mood: ['intention'],
  intention: ['topic'],
  topic: ['finding'],
  finding: ['preview', 'dissolved'], // Can find match or fail
  preview: ['ephemeral_chat', 'dissolved'], // Can start chat or disconnect
  ephemeral_chat: ['swipe_result', 'dissolved'],
  swipe_result: ['messaging_only', 'matched', 'dissolved'],
  messaging_only: ['matched', 'dissolved'],
  matched: [], // Terminal state
  dissolved: [], // Terminal state
}

export function canTransition(from: MatchmakingState, to: MatchmakingState): boolean {
  return MATCHMAKING_STATE_TRANSITIONS[from]?.includes(to) ?? false
}

export function getNextState(current: MatchmakingState, context: MatchmakingContext): MatchmakingState | null {
  switch (current) {
    case 'mood':
      return context.mood ? 'intention' : null
    case 'intention':
      return context.intention ? 'topic' : null
    case 'topic':
      return context.topic ? 'finding' : null
    case 'finding':
      return context.matchSessionId ? 'preview' : 'dissolved'
    case 'preview':
      return 'ephemeral_chat' // Auto-transition after preview
    case 'ephemeral_chat':
      if (context.swipeDirection) {
        return 'swipe_result'
      }
      return null
    case 'swipe_result':
      if (context.swipeDirection === 'right' && context.otherUserSwipe === 'right') {
        return 'matched'
      }
      if (context.swipeDirection === 'right' && !context.otherUserSwipe) {
        return 'messaging_only'
      }
      return 'dissolved'
    case 'messaging_only':
      // Can transition to matched if other user also swipes right
      if (context.otherUserSwipe === 'right') {
        return 'matched'
      }
      return null
    default:
      return null
  }
}

