"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { MatchmakingState, MatchmakingContext as MatchmakingContextType } from '@/lib/matchmaking-state-machine'

interface MatchmakingContextValue {
  context: MatchmakingContextType
  setMood: (mood: string) => void
  setIntention: (intention: string) => void
  setTopic: (topic: string) => void
  setMatchSessionId: (sessionId: string | null) => void
  setMatchedUserId: (userId: string | null) => void
  addEphemeralMessage: (text: string, senderId: string) => void
  setSwipeDirection: (direction: 'left' | 'right' | null) => void
  setOtherUserSwipe: (direction: 'left' | 'right' | null) => void
  transitionTo: (newState: MatchmakingState) => void
  reset: () => void
}

const initialContext: MatchmakingContextType = {
  state: 'mood',
  mood: null,
  intention: null,
  topic: null,
  matchSessionId: null,
  matchedUserId: null,
  previewStartedAt: null,
  ephemeralChatMessages: [],
  swipeDirection: null,
  otherUserSwipe: null,
}

const MatchmakingContext = createContext<MatchmakingContextValue | undefined>(undefined)

export function MatchmakingProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<MatchmakingContextType>(initialContext)

  const setMood = useCallback((mood: string) => {
    setContext(prev => ({ ...prev, mood, state: 'intention' }))
  }, [])

  const setIntention = useCallback((intention: string) => {
    setContext(prev => ({ ...prev, intention, state: 'topic' }))
  }, [])

  const setTopic = useCallback((topic: string) => {
    setContext(prev => ({ ...prev, topic, state: 'finding' }))
  }, [])

  const setMatchSessionId = useCallback((sessionId: string | null) => {
    setContext(prev => ({ ...prev, matchSessionId: sessionId, state: sessionId ? 'preview' : 'dissolved' }))
  }, [])

  const setMatchedUserId = useCallback((userId: string | null) => {
    setContext(prev => ({ ...prev, matchedUserId: userId }))
  }, [])

  const addEphemeralMessage = useCallback((text: string, senderId: string) => {
    setContext(prev => ({
      ...prev,
      ephemeralChatMessages: [
        ...prev.ephemeralChatMessages,
        {
          id: `${Date.now()}-${Math.random()}`,
          text,
          senderId,
          timestamp: new Date(),
        },
      ],
    }))
  }, [])

  const setSwipeDirection = useCallback((direction: 'left' | 'right' | null) => {
    setContext(prev => ({ ...prev, swipeDirection: direction }))
  }, [])

  const setOtherUserSwipe = useCallback((direction: 'left' | 'right' | null) => {
    setContext(prev => ({ ...prev, otherUserSwipe: direction }))
  }, [])

  const transitionTo = useCallback((newState: MatchmakingState) => {
    setContext(prev => ({ ...prev, state: newState }))
  }, [])

  const reset = useCallback(() => {
    setContext(initialContext)
  }, [])

  return (
    <MatchmakingContext.Provider
      value={{
        context,
        setMood,
        setIntention,
        setTopic,
        setMatchSessionId,
        setMatchedUserId,
        addEphemeralMessage,
        setSwipeDirection,
        setOtherUserSwipe,
        transitionTo,
        reset,
      }}
    >
      {children}
    </MatchmakingContext.Provider>
  )
}

export function useMatchmaking() {
  const context = useContext(MatchmakingContext)
  if (context === undefined) {
    throw new Error('useMatchmaking must be used within MatchmakingProvider')
  }
  return context
}

