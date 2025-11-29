"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useMatchmaking } from '@/context/MatchmakingContext'
import { tokensV2, animations } from '@/lib/design-tokens-v2'

export function SwipeResultStep() {
  const router = useRouter()
  const { context, setOtherUserSwipe, transitionTo } = useMatchmaking()

  useEffect(() => {
    // Check if other user has swiped
    const checkOtherUserSwipe = async () => {
      if (!context.matchSessionId) return

      try {
        const response = await fetch(`/api/matchmaking-v2/session/${context.matchSessionId}/swipe-status`)
        const data = await response.json()

        if (data.success && data.otherUserSwipe) {
          setOtherUserSwipe(data.otherUserSwipe)
          
          // Determine next state
          if (context.swipeDirection === 'right' && data.otherUserSwipe === 'right') {
            // Both swiped right - matched!
            transitionTo('matched')
          } else if (context.swipeDirection === 'right' && !data.otherUserSwipe) {
            // User swiped right, other hasn't - messaging only
            transitionTo('messaging_only')
          } else {
            // User swiped left or other swiped left - dissolved
            transitionTo('dissolved')
          }
        } else if (context.swipeDirection === 'right') {
          // User swiped right, waiting for other user
          transitionTo('messaging_only')
        } else {
          // User swiped left - dissolved
          transitionTo('dissolved')
        }
      } catch (error) {
        console.error('[SwipeResultStep] Error checking swipe status:', error)
        transitionTo('dissolved')
      }
    }

    checkOtherUserSwipe()
  }, [context.matchSessionId, context.swipeDirection, setOtherUserSwipe, transitionTo])

  if (context.swipeDirection === 'right' && !context.otherUserSwipe) {
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
        <div style={{ fontSize: '64px' }}>💬</div>
        <div>
          <h1 style={{
            fontSize: tokensV2.typography.fontSize['2xl'],
            fontWeight: tokensV2.typography.fontWeight.bold,
            color: tokensV2.colors.textPrimary,
            margin: 0,
            marginBottom: tokensV2.spacing[8],
            textAlign: 'center',
          }}>
            Waiting for response...
          </h1>
          <p style={{
            fontSize: tokensV2.typography.fontSize.base,
            color: tokensV2.colors.textSecondary,
            margin: 0,
            textAlign: 'center',
          }}>
            They&apos;ll see your interest soon
          </p>
        </div>
      </motion.div>
    )
  }

  if (context.swipeDirection === 'left') {
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
        <div style={{ fontSize: '64px' }}>👋</div>
        <div>
          <h1 style={{
            fontSize: tokensV2.typography.fontSize['2xl'],
            fontWeight: tokensV2.typography.fontWeight.bold,
            color: tokensV2.colors.textPrimary,
            margin: 0,
            marginBottom: tokensV2.spacing[8],
            textAlign: 'center',
          }}>
            Match dissolved
          </h1>
          <p style={{
            fontSize: tokensV2.typography.fontSize.base,
            color: tokensV2.colors.textSecondary,
            margin: 0,
            textAlign: 'center',
          }}>
            You can try matching again
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/match-v2')}
          style={{
            padding: `${tokensV2.spacing[12]} ${tokensV2.spacing[24]}`,
            borderRadius: tokensV2.borderRadius.medium,
            background: tokensV2.gradients.primary,
            color: tokensV2.colors.textOnDark,
            fontSize: tokensV2.typography.fontSize.base,
            fontWeight: tokensV2.typography.fontWeight.semibold,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Try Again
        </motion.button>
      </motion.div>
    )
  }

  return null
}

