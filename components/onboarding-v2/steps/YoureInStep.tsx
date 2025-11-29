"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useOnboardingV2 } from '@/context/OnboardingV2Context'
import { useAuth } from '@/hooks/use-auth'
import { tokensV2, animations } from '@/lib/design-tokens-v2'

export function YoureInStep() {
  const router = useRouter()
  const { user } = useAuth()
  const { completeOnboarding, state } = useOnboardingV2()

  useEffect(() => {
    // Auto-complete onboarding when this step is reached
    if (state.step === 'youre-in' && user?.id) {
      completeOnboarding(user.id)
    }
  }, [state.step, user?.id, completeOnboarding])

  const handleGoToHome = () => {
    router.push('/home-v2')
  }

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
      <div style={{
        fontSize: '64px',
      }}>
        🎉
      </div>

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
          You&apos;re In!
        </h1>
        <p style={{
          fontSize: tokensV2.typography.fontSize.base,
          color: tokensV2.colors.textSecondary,
          margin: 0,
          lineHeight: tokensV2.typography.lineHeight.relaxed,
        }}>
          Welcome to Narrative. You&apos;re all set to start connecting with people who share your interests.
        </p>
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleGoToHome}
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
        Go to Home
      </motion.button>
    </motion.div>
  )
}

