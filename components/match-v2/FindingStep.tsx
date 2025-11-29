"use client"

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useMatchmaking } from '@/context/MatchmakingContext'
import { useAuth } from '@/hooks/use-auth'
import { tokensV2, animations } from '@/lib/design-tokens-v2'

export function FindingStep() {
  const { context, setMatchSessionId, transitionTo } = useMatchmaking()
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.id || !context.mood || !context.intention || !context.topic) {
      return
    }

    // Find a match
    const findMatch = async () => {
      try {
        const response = await fetch('/api/matchmaking-v2/find', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            mood: context.mood,
            intention: context.intention,
            topic: context.topic,
          }),
        })

        const data = await response.json()

        if (data.success && data.sessionId) {
          setMatchSessionId(data.sessionId)
          transitionTo('preview')
        } else {
          // No match found
          transitionTo('dissolved')
        }
      } catch (error) {
        console.error('[FindingStep] Error finding match:', error)
        transitionTo('dissolved')
      }
    }

    findMatch()
  }, [user?.id, context.mood, context.intention, context.topic, setMatchSessionId, transitionTo])

  return (
    <motion.div
      {...animations.fadeUp}
      style={{
        padding: tokensV2.spacing[24],
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: tokensV2.spacing[24],
      }}
    >
      <div style={{
        fontSize: '64px',
        animation: 'pulse 2s ease-in-out infinite',
      }}>
        🔍
      </div>
      <div>
        <h1 style={{
          fontSize: tokensV2.typography.fontSize['2xl'],
          fontWeight: tokensV2.typography.fontWeight.bold,
          color: tokensV2.colors.textPrimary,
          margin: 0,
          marginBottom: tokensV2.spacing[8],
          textAlign: 'center',
        }}>
          Finding your match...
        </h1>
        <p style={{
          fontSize: tokensV2.typography.fontSize.base,
          color: tokensV2.colors.textSecondary,
          margin: 0,
          textAlign: 'center',
        }}>
          We&apos;re looking for someone compatible
        </p>
      </div>
    </motion.div>
  )
}

