"use client"

import { motion } from 'framer-motion'
import { useOnboardingV2 } from '@/context/OnboardingV2Context'
import { tokensV2, animations } from '@/lib/design-tokens-v2'

export function WelcomeStep() {
  const { nextStep } = useOnboardingV2()

  return (
    <motion.div
      {...animations.fadeUp}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: tokensV2.spacing[32],
      }}
    >
      {/* Narrative Logo */}
      <div style={{
        fontSize: '48px',
        fontWeight: tokensV2.typography.fontWeight.bold,
        background: tokensV2.gradients.primary,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        Narrative
      </div>

      {/* Welcome Text */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: tokensV2.spacing[16],
      }}>
        <h1 style={{
          fontSize: tokensV2.typography.fontSize['3xl'],
          fontWeight: tokensV2.typography.fontWeight.bold,
          color: tokensV2.colors.textPrimary,
          margin: 0,
        }}>
          Welcome to Narrative
        </h1>
        <p style={{
          fontSize: tokensV2.typography.fontSize.base,
          color: tokensV2.colors.textSecondary,
          margin: 0,
          lineHeight: tokensV2.typography.lineHeight.relaxed,
        }}>
          Connect with people who share your interests. Start meaningful conversations.
        </p>
      </div>

      {/* Get Started Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={nextStep}
        style={{
          width: '100%',
          padding: `${tokensV2.spacing[16]} ${tokensV2.spacing[32]}`,
          borderRadius: tokensV2.borderRadius.full,
          background: tokensV2.gradients.primary,
          color: tokensV2.colors.textOnDark,
          fontSize: tokensV2.typography.fontSize.lg,
          fontWeight: tokensV2.typography.fontWeight.semibold,
          border: 'none',
          cursor: 'pointer',
          boxShadow: tokensV2.shadows.medium,
        }}
      >
        Get Started
      </motion.button>
    </motion.div>
  )
}

