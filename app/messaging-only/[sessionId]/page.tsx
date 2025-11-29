"use client"

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/use-auth'
import { tokensV2, animations } from '@/lib/design-tokens-v2'
import { Send, X, Heart } from 'lucide-react'
import { NavbarV2 } from '@/components/ui/navbar-v2'

export default function MessagingOnlyPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const sessionId = params.sessionId as string
  
  const [messages, setMessages] = useState<Array<{ id: string; text: string; senderId: string; timestamp: Date }>>([])
  const [message, setMessage] = useState('')
  const [otherUserSwipe, setOtherUserSwipe] = useState<'left' | 'right' | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!sessionId || !user?.id) return

    // Check if other user has swiped right (mutual match)
    const checkSwipeStatus = async () => {
      try {
        const response = await fetch(`/api/matchmaking-v2/session/${sessionId}/swipe-status?userId=${user.id}`)
        const data = await response.json()

        if (data.success) {
          setOtherUserSwipe(data.otherUserSwipe)
          
          // If both swiped right, navigate to matched state (create Loop)
          if (data.otherUserSwipe === 'right') {
            // TODO: Create Loop and navigate to it
            router.push(`/loops?matched=${sessionId}`)
          }
        }
      } catch (error) {
        console.error('[MessagingOnly] Error checking swipe status:', error)
      }
    }

    const interval = setInterval(checkSwipeStatus, 2000) // Check every 2 seconds
    checkSwipeStatus()

    return () => clearInterval(interval)
  }, [sessionId, user?.id, router])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !user?.id) return

    // Add message to ephemeral chat (in-memory only)
    setMessages(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      text: message.trim(),
      senderId: user.id,
      timestamp: new Date(),
    }])
    setMessage('')
  }

  const handleStayConnected = async () => {
    // Create Loop from messaging-only state
    try {
      const response = await fetch('/api/loops/create-from-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId: user?.id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/loops/${data.loopId}`)
      }
    } catch (error) {
      console.error('[MessagingOnly] Error creating loop:', error)
    }
  }

  const handleNotNow = () => {
    // Dissolve the connection
    router.push('/match-v2')
  }

  const handleBlock = async () => {
    // TODO: Implement block/report flow
    router.push('/match-v2')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: tokensV2.colors.backgroundEggshell,
      paddingBottom: '80px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: tokensV2.spacing[24],
        background: tokensV2.colors.backgroundWhite,
        borderBottom: `1px solid ${tokensV2.colors.borderLight}`,
      }}>
        <h1 style={{
          fontSize: tokensV2.typography.fontSize.xl,
          fontWeight: tokensV2.typography.fontWeight.bold,
          color: tokensV2.colors.textPrimary,
          margin: 0,
        }}>
          Messaging Only
        </h1>
        <p style={{
          fontSize: tokensV2.typography.fontSize.sm,
          color: tokensV2.colors.textSecondary,
          margin: tokensV2.spacing[4],
        }}>
          Text only - no calls or media
        </p>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: tokensV2.spacing[24],
        display: 'flex',
        flexDirection: 'column',
        gap: tokensV2.spacing[12],
      }}>
        {messages.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: tokensV2.typography.fontSize.base,
              color: tokensV2.colors.textSecondary,
              margin: 0,
            }}>
              Start the conversation...
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isOwn = msg.senderId === user?.id
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: isOwn ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={{
                    maxWidth: '70%',
                    padding: `${tokensV2.spacing[12]} ${tokensV2.spacing[16]}`,
                    borderRadius: tokensV2.borderRadius.medium,
                    background: isOwn ? tokensV2.gradients.primary : tokensV2.colors.backgroundWhite,
                    color: isOwn ? tokensV2.colors.textOnDark : tokensV2.colors.textPrimary,
                    boxShadow: tokensV2.shadows.small,
                  }}>
                    {msg.text}
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} style={{
        padding: tokensV2.spacing[16],
        background: tokensV2.colors.backgroundWhite,
        borderTop: `1px solid ${tokensV2.colors.borderLight}`,
        display: 'flex',
        gap: tokensV2.spacing[8],
      }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: tokensV2.spacing[12],
            borderRadius: tokensV2.borderRadius.medium,
            border: `1px solid ${tokensV2.colors.borderLight}`,
            fontSize: tokensV2.typography.fontSize.base,
            background: tokensV2.colors.backgroundWhite,
          }}
        />
        <motion.button
          type="submit"
          whileTap={{ scale: 0.95 }}
          disabled={!message.trim()}
          style={{
            padding: tokensV2.spacing[12],
            borderRadius: tokensV2.borderRadius.medium,
            background: message.trim() ? tokensV2.gradients.primary : tokensV2.colors.borderLight,
            color: tokensV2.colors.textOnDark,
            border: 'none',
            cursor: message.trim() ? 'pointer' : 'not-allowed',
            opacity: message.trim() ? 1 : 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Send size={20} />
        </motion.button>
      </form>

      {/* Actions */}
      <div style={{
        padding: tokensV2.spacing[16],
        background: tokensV2.colors.backgroundWhite,
        borderTop: `1px solid ${tokensV2.colors.borderLight}`,
        display: 'flex',
        flexDirection: 'column',
        gap: tokensV2.spacing[12],
      }}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleStayConnected}
          style={{
            width: '100%',
            padding: tokensV2.spacing[16],
            borderRadius: tokensV2.borderRadius.medium,
            background: tokensV2.gradients.primary,
            color: tokensV2.colors.textOnDark,
            fontSize: tokensV2.typography.fontSize.base,
            fontWeight: tokensV2.typography.fontWeight.semibold,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: tokensV2.spacing[8],
          }}
        >
          <Heart size={20} />
          Stay Connected
        </motion.button>
        <div style={{ display: 'flex', gap: tokensV2.spacing[12] }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleNotNow}
            style={{
              flex: 1,
              padding: tokensV2.spacing[12],
              borderRadius: tokensV2.borderRadius.medium,
              border: `1px solid ${tokensV2.colors.borderMedium}`,
              background: tokensV2.colors.backgroundWhite,
              color: tokensV2.colors.textPrimary,
              fontSize: tokensV2.typography.fontSize.base,
              fontWeight: tokensV2.typography.fontWeight.medium,
              cursor: 'pointer',
            }}
          >
            Not Now
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleBlock}
            style={{
              flex: 1,
              padding: tokensV2.spacing[12],
              borderRadius: tokensV2.borderRadius.medium,
              border: `1px solid ${tokensV2.colors.accentPink}`,
              background: tokensV2.colors.backgroundWhite,
              color: tokensV2.colors.accentPink,
              fontSize: tokensV2.typography.fontSize.base,
              fontWeight: tokensV2.typography.fontWeight.medium,
              cursor: 'pointer',
            }}
          >
            Block/Report
          </motion.button>
        </div>
      </div>

      <NavbarV2 />
    </div>
  )
}

