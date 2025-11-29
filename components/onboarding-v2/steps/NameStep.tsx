"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useOnboardingV2 } from '@/context/OnboardingV2Context'
import { tokensV2, animations } from '@/lib/design-tokens-v2'

export function NameStep() {
  const { state, setFirstName, setLastName, nextStep, previousStep } = useOnboardingV2()
  const [localFirstName, setLocalFirstName] = useState(state.firstName)
  const [localLastName, setLocalLastName] = useState(state.lastName)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (localFirstName.trim() && localLastName.trim()) {
      setFirstName(localFirstName.trim())
      setLastName(localLastName.trim())
      nextStep()
    }
  }

  const isValid = localFirstName.trim().length > 0 && localLastName.trim().length > 0

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
          What&apos;s your name?
        </h1>
        <p style={{
          fontSize: tokensV2.typography.fontSize.sm,
          color: tokensV2.colors.textSecondary,
          margin: 0,
        }}>
          This will be used to create your username
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
            First Name
          </label>
          <input
            type="text"
            value={localFirstName}
            onChange={(e) => setLocalFirstName(e.target.value)}
            placeholder="First name"
            required
            autoFocus
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
            Last Name
          </label>
          <input
            type="text"
            value={localLastName}
            onChange={(e) => setLocalLastName(e.target.value)}
            placeholder="Last name"
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

