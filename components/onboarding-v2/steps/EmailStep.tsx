"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useOnboardingV2 } from '@/context/OnboardingV2Context'
import { tokensV2, animations } from '@/lib/design-tokens-v2'

export function EmailStep() {
  const { state, setEmail, nextStep } = useOnboardingV2()
  const [localEmail, setLocalEmail] = useState(state.email)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate email
    if (!localEmail.includes('@') || !localEmail.includes('.')) {
      setError('Please enter a valid email address')
      return
    }

    setEmail(localEmail)
    nextStep()
  }

  const isValid = localEmail.includes('@') && localEmail.includes('.')

  return (
    <motion.div
      {...animations.fadeUp}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: tokensV2.spacing[24],
      }}
    >
      <div>
        <h1 style={{
          fontSize: tokensV2.typography.fontSize['2xl'],
          fontWeight: tokensV2.typography.fontWeight.bold,
          color: tokensV2.colors.textPrimary,
          margin: 0,
          marginBottom: tokensV2.spacing[8],
        }}>
          What&apos;s your email?
        </h1>
        <p style={{
          fontSize: tokensV2.typography.fontSize.sm,
          color: tokensV2.colors.textSecondary,
          margin: 0,
        }}>
          We&apos;ll use this to create your account
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: tokensV2.spacing[20] }}>
        <div>
          <input
            type="email"
            value={localEmail}
            onChange={(e) => {
              setLocalEmail(e.target.value)
              setError(null)
            }}
            placeholder="you@example.com"
            required
            autoFocus
            style={{
              width: '100%',
              padding: tokensV2.spacing[12],
              borderRadius: tokensV2.borderRadius.medium,
              border: `1px solid ${error ? tokensV2.colors.accentPink : tokensV2.colors.borderLight}`,
              fontSize: tokensV2.typography.fontSize.base,
              background: tokensV2.colors.backgroundWhite,
            }}
          />
          {error && (
            <p style={{
              fontSize: tokensV2.typography.fontSize.sm,
              color: tokensV2.colors.accentPink,
              margin: `${tokensV2.spacing[8]} 0 0 0`,
            }}>
              {error}
            </p>
          )}
        </div>

        <motion.button
          type="submit"
          whileTap={{ scale: 0.95 }}
          disabled={!isValid}
          style={{
            width: '100%',
            padding: tokensV2.spacing[12],
            borderRadius: tokensV2.borderRadius.medium,
            background: isValid ? tokensV2.gradients.primary : tokensV2.colors.borderLight,
            color: tokensV2.colors.textOnDark,
            fontSize: tokensV2.typography.fontSize.base,
            fontWeight: tokensV2.typography.fontWeight.semibold,
            border: 'none',
            cursor: isValid ? 'pointer' : 'not-allowed',
            opacity: isValid ? 1 : 0.5,
          }}
        >
          Continue
        </motion.button>
      </form>
    </motion.div>
  )
}

