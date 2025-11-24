"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface PresenceData {
  isOnline: boolean
  lastSeenAt: Date | null
}

/**
 * Hook for real-time user presence (online/offline status)
 */
export function usePresence(userId: string | null) {
  const [presence, setPresence] = useState<PresenceData>({
    isOnline: false,
    lastSeenAt: null,
  })

  useEffect(() => {
    if (!userId) return

    // Set user as online when component mounts
    const setOnline = async () => {
      try {
        await fetch('/api/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            isOnline: true,
          }),
        })
      } catch (error) {
        console.error('Error setting online status:', error)
      }
    }

    // Set user as offline when component unmounts
    const setOffline = async () => {
      try {
        await fetch('/api/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            isOnline: false,
          }),
        })
      } catch (error) {
        console.error('Error setting offline status:', error)
      }
    }

    setOnline()

    // Update last seen every 30 seconds while online
    const presenceInterval = setInterval(() => {
      setOnline()
    }, 30000)

    // Subscribe to presence changes
    const channel = supabase
      .channel(`presence:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_presence',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const presenceData = payload.new as any
          setPresence({
            isOnline: presenceData.is_online,
            lastSeenAt: presenceData.last_seen_at ? new Date(presenceData.last_seen_at) : null,
          })
        }
      )
      .subscribe()

    // Handle page visibility (tab switch, minimize, etc.)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOffline()
      } else {
        setOnline()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(presenceInterval)
      channel.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      setOffline()
    }
  }, [userId])

  // Function to get presence for another user
  const getOtherUserPresence = async (otherUserId: string): Promise<PresenceData> => {
    try {
      const response = await fetch(`/api/presence?userId=${otherUserId}`)
      const data = await response.json()
      if (data.success && data.data) {
        return {
          isOnline: data.data.is_online,
          lastSeenAt: data.data.last_seen_at ? new Date(data.data.last_seen_at) : null,
        }
      }
    } catch (error) {
      console.error('Error getting presence:', error)
    }
    return { isOnline: false, lastSeenAt: null }
  }

  return { presence, getOtherUserPresence }
}

