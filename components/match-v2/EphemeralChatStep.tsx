"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useMatchmaking } from '@/context/MatchmakingContext'
import { useAuth } from '@/hooks/use-auth'
import { tokensV2, animations } from '@/lib/design-tokens-v2'
import { Send } from 'lucide-react'

export function EphemeralChatStep() {
  const router = useRouter()
  const { context, addEphemeralMessage, setSwipeDirection, transitionTo } = useMatchmaking()
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [context.ephemeralChatMessages])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !user?.id) return

    // Add message to ephemeral chat (in-memory only, never persisted)
    addEphemeralMessage(message.trim(), user.id)
    setMessage('')
  }

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!context.matchSessionId || !user?.id) return

    try {
      // Record swipe in database
      const response = await fetch(`/api/matchmaking-v2/session/${context.matchSessionId}/swipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          direction,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSwipeDirection(direction)
        
        if (data.matched) {
          // Both swiped right - matched! Navigate to loop creation
          router.push(`/loops?matched=${context.matchSessionId}`)
        } else if (direction === 'right') {
          // User swiped right, navigate to messaging-only state
          router.push(`/messaging-only/${context.matchSessionId}`)
        } else {
          // User swiped left - dissolved
          transitionTo('dissolved')
        }
      }
    } catch (error) {
      console.error('[EphemeralChatStep] Error recording swipe:', error)
    }
  }

  return (
    <motion.div
      {...animations.fadeUp}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 160px)',
        padding: tokensV2.spacing[24],
      }}
    >
      {/* Chat Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: tokensV2.spacing[12],
        marginBottom: tokensV2.spacing[16],
      }}>
        {context.ephemeralChatMessages.length === 0 ? (
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
            {context.ephemeralChatMessages.map((msg) => {
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
        display: 'flex',
        gap: tokensV2.spacing[8],
        marginBottom: tokensV2.spacing[16],
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

      {/* Swipe Actions */}
      <div style={{
        display: 'flex',
        gap: tokensV2.spacing[12],
      }}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleSwipe('left')}
          style={{
            flex: 1,
            padding: tokensV2.spacing[16],
            borderRadius: tokensV2.borderRadius.medium,
            border: `2px solid ${tokensV2.colors.accentPink}`,
            background: tokensV2.colors.backgroundWhite,
            color: tokensV2.colors.accentPink,
            fontSize: tokensV2.typography.fontSize.base,
            fontWeight: tokensV2.typography.fontWeight.semibold,
            cursor: 'pointer',
          }}
        >
          Skip
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleSwipe('right')}
          style={{
            flex: 1,
            padding: tokensV2.spacing[16],
            borderRadius: tokensV2.borderRadius.medium,
            background: tokensV2.gradients.primary,
            color: tokensV2.colors.textOnDark,
            fontSize: tokensV2.typography.fontSize.base,
            fontWeight: tokensV2.typography.fontWeight.semibold,
            border: 'none',
            cursor: 'pointer',
            boxShadow: tokensV2.shadows.medium,
          }}
        >
          Connect
        </motion.button>
      </div>
    </motion.div>
  )
}

