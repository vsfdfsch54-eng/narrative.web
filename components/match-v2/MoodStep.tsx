"use client"

import { motion } from 'framer-motion'
import { useMatchmaking } from '@/context/MatchmakingContext'
import { tokensV2, animations } from '@/lib/design-tokens-v2'

const MOODS = [
  { id: 'happy', emoji: '😄', label: 'Happy' },
  { id: 'content', emoji: '🙂', label: 'Content' },
  { id: 'neutral', emoji: '😐', label: 'Neutral' },
  { id: 'sad', emoji: '😔', label: 'Sad' },
]

export function MoodStep() {
  const { setMood } = useMatchmaking()

  return (
    <motion.div
      {...animations.fadeUp}
      style={{
        padding: tokensV2.spacing[24],
        display: 'flex',
        flexDirection: 'column',
        gap: tokensV2.spacing[32],
      }}
    >
      <div>
        <h1 style={{
          fontSize: tokensV2.typography.fontSize['3xl'],
          fontWeight: tokensV2.typography.fontWeight.bold,
          color: tokensV2.colors.textPrimary,
          margin: 0,
          marginBottom: tokensV2.spacing[8],
        }}>
          How are you feeling?
        </h1>
        <p style={{
          fontSize: tokensV2.typography.fontSize.base,
          color: tokensV2.colors.textSecondary,
          margin: 0,
        }}>
          Choose your mood to find compatible matches
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: tokensV2.spacing[16],
      }}>
        {MOODS.map((mood) => (
          <motion.button
            key={mood.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMood(mood.id)}
            style={{
              padding: tokensV2.spacing[32],
              borderRadius: tokensV2.borderRadius.medium,
              border: `2px solid ${tokensV2.colors.borderLight}`,
              background: tokensV2.colors.backgroundWhite,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: tokensV2.spacing[12],
              boxShadow: tokensV2.shadows.small,
              transition: tokensV2.transitions.normal,
            }}
            whileHover={{
              scale: 1.02,
              boxShadow: tokensV2.shadows.medium,
            }}
          >
            <span style={{ fontSize: '64px' }}>{mood.emoji}</span>
            <span style={{
              fontSize: tokensV2.typography.fontSize.lg,
              fontWeight: tokensV2.typography.fontWeight.semibold,
              color: tokensV2.colors.textPrimary,
            }}>
              {mood.label}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

