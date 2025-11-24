"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Message } from '@/lib/types'

/**
 * Hook for real-time chat messages using Supabase Realtime
 * Replaces polling with instant message delivery
 */
export function useRealtimeChat(matchId: string | null, currentUserId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    if (!matchId || !currentUserId) return

    // Load initial messages
    const loadInitialMessages = async () => {
      try {
        const response = await fetch(`/api/messages?matchId=${matchId}`)
        const data = await response.json()
        if (data.success && data.data) {
          const dbMessages: Message[] = data.data.map((msg: any) => ({
            id: msg.id,
            senderId: msg.sender_id,
            content: msg.text,
            timestamp: new Date(msg.created_at),
            read: !!msg.read_at,
            readAt: msg.read_at ? new Date(msg.read_at) : null,
            reactions: msg.reactions || {},
            messageType: msg.message_type || 'text',
            fileUrl: msg.file_url,
            fileName: msg.file_name,
            fileSize: msg.file_size,
          }))
          setMessages(dbMessages)
        }
      } catch (error) {
        console.error('Error loading initial messages:', error)
      }
    }

    loadInitialMessages()

    // Subscribe to real-time message changes
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newMessage = payload.new as any
          const message: Message = {
            id: newMessage.id,
            senderId: newMessage.sender_id,
            content: newMessage.text,
            timestamp: new Date(newMessage.created_at),
            read: !!newMessage.read_at,
            readAt: newMessage.read_at ? new Date(newMessage.read_at) : null,
            reactions: newMessage.reactions || {},
            messageType: newMessage.message_type || 'text',
            fileUrl: newMessage.file_url,
            fileName: newMessage.file_name,
            fileSize: newMessage.file_size,
          }
          
          // Only add if not already in messages (avoid duplicates)
          setMessages(prev => {
            if (prev.some(m => m.id === message.id)) {
              return prev
            }
            return [...prev, message]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as any
          setMessages(prev =>
            prev.map(msg =>
              msg.id === updatedMessage.id
                ? {
                    ...msg,
                    read: !!updatedMessage.read_at,
                    readAt: updatedMessage.read_at ? new Date(updatedMessage.read_at) : null,
                    reactions: updatedMessage.reactions || {},
                  }
                : msg
            )
          )
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [matchId, currentUserId])

  return { messages, setMessages }
}

