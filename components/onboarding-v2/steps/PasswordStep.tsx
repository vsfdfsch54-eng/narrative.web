"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useOnboardingV2 } from '@/context/OnboardingV2Context'
import { tokensV2, animations } from '@/lib/design-tokens-v2'

export function PasswordStep() {
  const { state, setPassword, setPasswordConfirm, nextStep, previousStep } = useOnboardingV2()
  const [localPassword, setLocalPassword] = useState(state.password)
  const [localPasswordConfirm, setLocalPasswordConfirm] = useState(state.passwordConfirm)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate password
    if (localPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    // Validate passwords match
    if (localPassword !== localPasswordConfirm) {
      setError('Passwords do not match')
      return
    }

    setPassword(localPassword)
    setPasswordConfirm(localPasswordConfirm)
    nextStep()
  }

  const isValid = localPassword.length >= 6 && localPassword === localPasswordConfirm

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
          Create a password
        </h1>
        <p style={{
          fontSize: tokensV2.typography.fontSize.sm,
          color: tokensV2.colors.textSecondary,
          margin: 0,
        }}>
          Choose a secure password (at least 6 characters)
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
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={localPassword}
              onChange={(e) => {
                setLocalPassword(e.target.value)
                setError(null)
              }}
              placeholder="Enter password"
              required
              minLength={6}
              autoFocus
              style={{
                width: '100%',
                padding: tokensV2.spacing[12],
                paddingRight: '40px',
                borderRadius: tokensV2.borderRadius.medium,
                border: `1px solid ${error ? tokensV2.colors.accentPink : tokensV2.colors.borderLight}`,
                fontSize: tokensV2.typography.fontSize.base,
                background: tokensV2.colors.backgroundWhite,
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: tokensV2.spacing[8],
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: tokensV2.typography.fontSize.sm,
                color: tokensV2.colors.textSecondary,
              }}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: tokensV2.typography.fontSize.sm,
            fontWeight: tokensV2.typography.fontWeight.medium,
            color: tokensV2.colors.textPrimary,
            marginBottom: tokensV2.spacing[8],
          }}>
            Confirm Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPasswordConfirm ? 'text' : 'password'}
              value={localPasswordConfirm}
              onChange={(e) => {
                setLocalPasswordConfirm(e.target.value)
                setError(null)
              }}
              placeholder="Confirm password"
              required
              minLength={6}
              style={{
                width: '100%',
                padding: tokensV2.spacing[12],
                paddingRight: '40px',
                borderRadius: tokensV2.borderRadius.medium,
                border: `1px solid ${error ? tokensV2.colors.accentPink : tokensV2.colors.borderLight}`,
                fontSize: tokensV2.typography.fontSize.base,
                background: tokensV2.colors.backgroundWhite,
              }}
            />
            <button
              type="button"
              onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
              style={{
                position: 'absolute',
                right: tokensV2.spacing[8],
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: tokensV2.typography.fontSize.sm,
                color: tokensV2.colors.textSecondary,
              }}
            >
              {showPasswordConfirm ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
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
            disabled={!isValid}
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
            Continue
          </motion.button>
        </div>
      </form>
    </motion.div>
  )
}

