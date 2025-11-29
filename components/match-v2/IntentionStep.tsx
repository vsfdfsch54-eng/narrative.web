"use client"

import { motion } from 'framer-motion'
import { useMatchmaking } from '@/context/MatchmakingContext'
import { tokensV2, animations } from '@/lib/design-tokens-v2'

const INTENTIONS = [
  { id: 'reflect', emoji: '🎧', label: 'Reflect' },
  { id: 'talk', emoji: '💬', label: 'Talk' },
  { id: 'connect', emoji: '🤝', label: 'Connect' },
  { id: 'socialize', emoji: '🎉', label: 'Socialize' },
]

export function IntentionStep() {
  const { setIntention, context } = useMatchmaking()

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
          What do you want to do?
        </h1>
        <p style={{
          fontSize: tokensV2.typography.fontSize.base,
          color: tokensV2.colors.textSecondary,
          margin: 0,
        }}>
          Select your intention for this conversation
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: tokensV2.spacing[16],
      }}>
        {INTENTIONS.map((intention) => (
          <motion.button
            key={intention.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIntention(intention.id)}
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
            <span style={{ fontSize: '64px' }}>{intention.emoji}</span>
            <span style={{
              fontSize: tokensV2.typography.fontSize.lg,
              fontWeight: tokensV2.typography.fontWeight.semibold,
              color: tokensV2.colors.textPrimary,
            }}>
              {intention.label}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

