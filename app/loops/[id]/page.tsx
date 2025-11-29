"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/use-auth'
import { NavbarV2 } from '@/components/ui/navbar-v2'
import { tokensV2, animations } from '@/lib/design-tokens-v2'
import { checkV2UserStatus } from '@/lib/user-helpers-v2'
import { ArrowLeft, Send, Users } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function LoopDetailPage() {
  const router = useRouter()
  const params = useParams()
  const loopId = params.id as string
  const { user, loading: authLoading } = useAuth()
  const [loop, setLoop] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [participants, setParticipants] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  // Routing guard
  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.replace('/onboarding-v2')
      return
    }

    const checkStatus = async () => {
      const status = await checkV2UserStatus(user.id)
      if (status.needsOnboarding) {
        router.replace('/onboarding-v2')
      }
    }

    checkStatus()
  }, [user, authLoading, router])

  // Load loop data
  useEffect(() => {
    if (!user?.id || !loopId) return

    const loadLoop = async () => {
      try {
        setLoading(true)
        const [loopRes, messagesRes, participantsRes] = await Promise.all([
          fetch(`/api/loops/${loopId}?userId=${user.id}`),
          fetch(`/api/loops/${loopId}/messages?limit=50`),
          fetch(`/api/loops/${loopId}/participants`),
        ])

        const loopData = await loopRes.json()
        const messagesData = await messagesRes.json()
        const participantsData = await participantsRes.json()

        if (loopData.success) setLoop(loopData.data)
        if (messagesData.success) setMessages(messagesData.data || [])
        if (participantsData.success) setParticipants(participantsData.data || [])
      } catch (error) {
        console.error('[LoopDetailPage] Error loading loop:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLoop()
  }, [user?.id, loopId])

  // Real-time subscription for new messages
  useEffect(() => {
    if (!loopId) return

    const channel = supabase
      .channel(`loop:${loopId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'loop_messages',
          filter: `loop_id=eq.${loopId}`,
        },
        (payload) => {
          // Fetch the new message with sender info
          fetch(`/api/loops/${loopId}/messages?limit=50`)
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
                setMessages(data.data || [])
              }
            })
            .catch((error) => {
              console.error('[LoopDetailPage] Error fetching new message:', error)
            })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loopId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user?.id || sending) return

    try {
      setSending(true)
      const response = await fetch(`/api/loops/${loopId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.id,
          text: newMessage.trim(),
        }),
      })

      const data = await response.json()
      if (data.success) {
        setNewMessage('')
        // Reload messages
        const messagesRes = await fetch(`/api/loops/${loopId}/messages?limit=50`)
        const messagesData = await messagesRes.json()
        if (messagesData.success) {
          setMessages(messagesData.data || [])
        }
      }
    } catch (error) {
      console.error('[LoopDetailPage] Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: tokensV2.colors.backgroundEggshell,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ color: tokensV2.colors.textSecondary }}>Loading...</p>
      </div>
    )
  }

  if (!loop) {
    return (
      <div style={{
        minHeight: '100vh',
        background: tokensV2.colors.backgroundEggshell,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ color: tokensV2.colors.textSecondary }}>Loop not found</p>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: tokensV2.colors.backgroundEggshell,
      display: 'flex',
      flexDirection: 'column',
      paddingBottom: '80px',
    }}>
      {/* Header */}
      <div style={{
        background: tokensV2.gradients.primary,
        padding: `${tokensV2.spacing[24]} ${tokensV2.spacing[24]}`,
        color: tokensV2.colors.textOnDark,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: tokensV2.spacing[16],
        }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            style={{
              padding: tokensV2.spacing[8],
              borderRadius: tokensV2.borderRadius.full,
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={20} color={tokensV2.colors.textOnDark} />
          </motion.button>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: tokensV2.typography.fontSize['2xl'],
              fontWeight: tokensV2.typography.fontWeight.bold,
              margin: 0,
            }}>
              {loop.title}
            </h1>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: tokensV2.spacing[8],
              marginTop: tokensV2.spacing[4],
            }}>
              <Users size={16} />
              <span style={{
                fontSize: tokensV2.typography.fontSize.sm,
                opacity: 0.9,
              }}>
                {participants.length} {participants.length === 1 ? 'member' : 'members'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: tokensV2.spacing[24],
        display: 'flex',
        flexDirection: 'column',
        gap: tokensV2.spacing[16],
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: tokensV2.spacing[48],
            color: tokensV2.colors.textMuted,
          }}>
            <p style={{ margin: 0 }}>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <motion.div
              key={message.id}
              {...animations.fadeUp}
              style={{
                padding: tokensV2.spacing[16],
                borderRadius: tokensV2.borderRadius.medium,
                background: message.sender_id === user?.id
                  ? tokensV2.gradients.subtle
                  : tokensV2.colors.backgroundWhite,
                boxShadow: tokensV2.shadows.small,
                alignSelf: message.sender_id === user?.id ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
              }}
            >
              {message.sender && (
                <p style={{
                  fontSize: tokensV2.typography.fontSize.xs,
                  fontWeight: tokensV2.typography.fontWeight.medium,
                  color: tokensV2.colors.textSecondary,
                  margin: 0,
                  marginBottom: tokensV2.spacing[4],
                }}>
                  {message.sender.nickname || 'User'}
                </p>
              )}
              <p style={{
                fontSize: tokensV2.typography.fontSize.base,
                color: tokensV2.colors.textPrimary,
                margin: 0,
              }}>
                {message.text}
              </p>
              <p style={{
                fontSize: tokensV2.typography.fontSize.xs,
                color: tokensV2.colors.textMuted,
                margin: 0,
                marginTop: tokensV2.spacing[4],
              }}>
                {new Date(message.created_at).toLocaleTimeString()}
              </p>
            </motion.div>
          ))
        )}
      </div>

      {/* Message Input */}
      <form
        onSubmit={handleSendMessage}
        style={{
          padding: tokensV2.spacing[16],
          background: tokensV2.colors.backgroundWhite,
          borderTop: `1px solid ${tokensV2.colors.borderLight}`,
          display: 'flex',
          gap: tokensV2.spacing[12],
        }}
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: tokensV2.spacing[12],
            borderRadius: tokensV2.borderRadius.full,
            border: `1px solid ${tokensV2.colors.borderLight}`,
            fontSize: tokensV2.typography.fontSize.base,
            background: tokensV2.colors.backgroundEggshell,
          }}
        />
        <motion.button
          type="submit"
          whileTap={{ scale: 0.95 }}
          disabled={!newMessage.trim() || sending}
          style={{
            padding: tokensV2.spacing[12],
            borderRadius: tokensV2.borderRadius.full,
            background: tokensV2.gradients.primary,
            border: 'none',
            cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
            opacity: newMessage.trim() ? 1 : 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Send size={20} color={tokensV2.colors.textOnDark} />
        </motion.button>
      </form>

      <NavbarV2 />
    </div>
  )
}

