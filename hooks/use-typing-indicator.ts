"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

/**
 * Hook for real-time typing indicators
 */
export function useTypingIndicator(matchId: string | null, currentUserId: string | null, otherUserId: string | null) {
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false)

  useEffect(() => {
    if (!matchId || !currentUserId || !otherUserId) return

    // Subscribe to typing status changes
    const channel = supabase
      .channel(`typing:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_status',
          filter: `match_id=eq.${matchId}`,
        },
        async (payload) => {
          // Check if other user is typing
          const typingStatus = payload.new as any
          if (typingStatus && typingStatus.user_id === otherUserId) {
            setIsOtherUserTyping(typingStatus.is_typing === true)
            
            // Auto-hide typing indicator after 3 seconds of no updates
            if (typingStatus.is_typing) {
              setTimeout(() => {
                setIsOtherUserTyping(false)
              }, 3000)
            }
          }
        }
      )
      .subscribe()

    // Also poll for typing status (fallback)
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/typing?matchId=${matchId}&userId=${otherUserId}`)
        const data = await response.json()
        if (data.success && data.data) {
          setIsOtherUserTyping(data.data.is_typing === true)
        }
      } catch (error) {
        // Ignore errors
      }
    }, 1000)

    return () => {
      channel.unsubscribe()
      clearInterval(pollInterval)
    }
  }, [matchId, currentUserId, otherUserId])

  // Function to set current user's typing status
  const setTyping = async (typing: boolean) => {
    if (!matchId || !currentUserId) return
    
    try {
      await fetch('/api/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          userId: currentUserId,
          isTyping: typing,
        }),
      })
    } catch (error) {
      console.error('Error setting typing status:', error)
    }
  }

  return { isOtherUserTyping, setTyping }
}

