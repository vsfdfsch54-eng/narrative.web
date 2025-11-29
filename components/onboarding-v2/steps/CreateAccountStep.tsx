"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useOnboardingV2 } from '@/context/OnboardingV2Context'
import { tokensV2, animations } from '@/lib/design-tokens-v2'
import { Loader2 } from 'lucide-react'

export function CreateAccountStep() {
  const router = useRouter()
  const { createAccount, state } = useOnboardingV2()

  useEffect(() => {
    // Auto-create account when this step is reached
    if (state.step === 'create-account' && !state.loading && !state.error) {
      createAccount().then((result) => {
        if (result.success && result.userId) {
          // Redirect to home after successful account creation
          setTimeout(() => {
            router.push('/home-v2')
          }, 1500)
        }
      })
    }
  }, [state.step, state.loading, state.error, createAccount, router])

  if (state.loading) {
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
        <Loader2 style={{
          width: '48px',
          height: '48px',
          animation: 'spin 1s linear infinite',
          color: tokensV2.colors.accentSky,
        }} />
        <div>
          <h1 style={{
            fontSize: tokensV2.typography.fontSize['2xl'],
            fontWeight: tokensV2.typography.fontWeight.bold,
            color: tokensV2.colors.textPrimary,
            margin: 0,
            marginBottom: tokensV2.spacing[8],
          }}>
            Creating your account...
          </h1>
          <p style={{
            fontSize: tokensV2.typography.fontSize.base,
            color: tokensV2.colors.textSecondary,
            margin: 0,
          }}>
            This will just take a moment
          </p>
        </div>
      </motion.div>
    )
  }

  if (state.error) {
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
        <div style={{ fontSize: '64px' }}>⚠️</div>
        <div>
          <h1 style={{
            fontSize: tokensV2.typography.fontSize['2xl'],
            fontWeight: tokensV2.typography.fontWeight.bold,
            color: tokensV2.colors.textPrimary,
            margin: 0,
            marginBottom: tokensV2.spacing[8],
          }}>
            Something went wrong
          </h1>
          <p style={{
            fontSize: tokensV2.typography.fontSize.base,
            color: tokensV2.colors.accentPink,
            margin: 0,
          }}>
            {state.error}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => createAccount()}
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
      <div style={{ fontSize: '64px' }}>🎉</div>
      <div>
        <h1 style={{
          fontSize: tokensV2.typography.fontSize['3xl'],
          fontWeight: tokensV2.typography.fontWeight.bold,
          color: tokensV2.colors.textPrimary,
          margin: 0,
        }}>
          Welcome to Narrative!
        </h1>
        <p style={{
          fontSize: tokensV2.typography.fontSize.base,
          color: tokensV2.colors.textSecondary,
          margin: tokensV2.spacing[8],
          lineHeight: tokensV2.typography.lineHeight.relaxed,
        }}>
          Your account has been created. Redirecting you now...
        </p>
      </div>
    </motion.div>
  )
}

