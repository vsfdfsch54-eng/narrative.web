"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useOnboardingV2 } from '@/context/OnboardingV2Context'
import { useAuth } from '@/hooks/use-auth'
import { tokensV2, animations } from '@/lib/design-tokens-v2'

export function CreateAccountStep() {
  const { state, setEmail, setPassword, nextStep, previousStep } = useOnboardingV2()
  const { signUp } = useAuth()
  const [localEmail, setLocalEmail] = useState(state.email)
  const [localPassword, setLocalPassword] = useState(state.password)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error: signUpError } = await signUp(localEmail, localPassword)
      
      if (signUpError) {
        setError(signUpError.message || 'Failed to create account')
        setLoading(false)
        return
      }

      setEmail(localEmail)
      setPassword(localPassword)
      nextStep()
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const isValid = localEmail.includes('@') && localEmail.includes('.') && localPassword.length >= 6

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
          Create Account
        </h1>
        <p style={{
          fontSize: tokensV2.typography.fontSize.sm,
          color: tokensV2.colors.textSecondary,
          margin: 0,
        }}>
          Enter your email and create a password
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: tokensV2.spacing[20] }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: tokensV2.typography.fontSize.sm,
            fontWeight: tokensV2.typography.fontWeight.medium,
            color: tokensV2.colors.textPrimary,
            marginBottom: tokensV2.spacing[8],
          }}>
            Email
          </label>
          <input
            type="email"
            value={localEmail}
            onChange={(e) => setLocalEmail(e.target.value)}
            placeholder="you@example.com"
            required
            style={{
              width: '100%',
              padding: tokensV2.spacing[12],
              borderRadius: tokensV2.borderRadius.medium,
              border: `1px solid ${tokensV2.colors.borderLight}`,
              fontSize: tokensV2.typography.fontSize.base,
              background: tokensV2.colors.backgroundWhite,
            }}
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: tokensV2.typography.fontSize.sm,
            fontWeight: tokensV2.typography.fontWeight.medium,
            color: tokensV2.colors.textPrimary,
            marginBottom: tokensV2.spacing[8],
          }}>
            Password
          </label>
          <input
            type="password"
            value={localPassword}
            onChange={(e) => setLocalPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
            minLength={6}
            style={{
              width: '100%',
              padding: tokensV2.spacing[12],
              borderRadius: tokensV2.borderRadius.medium,
              border: `1px solid ${tokensV2.colors.borderLight}`,
              fontSize: tokensV2.typography.fontSize.base,
              background: tokensV2.colors.backgroundWhite,
            }}
          />
        </div>

        {error && (
          <p style={{
            fontSize: tokensV2.typography.fontSize.sm,
            color: tokensV2.colors.accentPink,
            margin: 0,
          }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: tokensV2.spacing[12], marginTop: tokensV2.spacing[8] }}>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={previousStep}
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
            Back
          </motion.button>
          <motion.button
            type="submit"
            whileTap={{ scale: 0.95 }}
            disabled={!isValid || loading}
            style={{
              flex: 1,
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
            {loading ? 'Creating...' : 'Continue'}
          </motion.button>
        </div>
      </form>
    </motion.div>
  )
}

