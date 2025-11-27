"use client"

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from './use-auth'

export interface Notification {
  id: string
  user_id: string
  sender_id: string | null
  type: 'friend_chat_request' | 'community_added' | 'event_invite' | 'match_found' | 'message_received'
  title: string
  body: string
  metadata: Record<string, any> | null
  is_read: boolean
  created_at: string
  sender?: {
    id: string
    name: string
    email: string
    avatar_url: string | null
  }
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Compute unread count in-memory
  const unreadCount = notifications.filter(n => !n.is_read).length

  // Fetch notifications from API
  const refresh = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/notifications?userId=${user.id}`, {
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.data) {
        // Sort by created_at DESC (already sorted by API, but ensure it)
        const sorted = [...data.data].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        setNotifications(sorted)
      } else {
        setNotifications([])
      }
    } catch (err: any) {
      console.error('[useNotifications] Error fetching notifications:', err)
      setError(err.message || 'Failed to fetch notifications')
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user?.id) return

    // Optimistic update
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    )

    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, userId: user.id }),
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Refresh to ensure sync
      await refresh()
    } catch (err: any) {
      console.error('[useNotifications] Error marking notification as read:', err)
      // Revert optimistic update on error
      await refresh()
    }
  }, [user?.id, refresh])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return

    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))

    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Refresh to ensure sync
      await refresh()
    } catch (err: any) {
      console.error('[useNotifications] Error marking all notifications as read:', err)
      // Revert optimistic update on error
      await refresh()
    }
  }, [user?.id, refresh])

  // Initial fetch and realtime subscription
  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    // Initial fetch
    refresh()

    // Subscribe to realtime notifications
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[useNotifications] New notification received:', payload)
          
          // Fetch sender profile for new notification
          if (payload.new.sender_id) {
            supabase
              .from('users')
              .select('id, name, email, avatar_url')
              .eq('id', payload.new.sender_id)
              .single()
              .then(({ data: sender }) => {
                const newNotification: Notification = {
                  ...payload.new as any,
                  sender: sender || undefined,
                }
                setNotifications(prev => [newNotification, ...prev].sort((a, b) =>
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                ))
              })
          } else {
            // No sender, just add notification
            const newNotification: Notification = payload.new as any
            setNotifications(prev => [newNotification, ...prev].sort((a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ))
          }
        }
      )
      .subscribe()

    // Cleanup
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, refresh])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
  }
}

