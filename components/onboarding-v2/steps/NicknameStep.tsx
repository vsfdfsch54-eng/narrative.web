"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useOnboardingV2 } from '@/context/OnboardingV2Context'
import { tokensV2, animations } from '@/lib/design-tokens-v2'

export function NicknameStep() {
  const { state, setNickname, nextStep, previousStep } = useOnboardingV2()
  const [localNickname, setLocalNickname] = useState(state.nickname)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (localNickname.trim()) {
      setNickname(localNickname.trim())
      nextStep()
    }
  }

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
          Choose your Conversation Nickname
        </h1>
        <p style={{
          fontSize: tokensV2.typography.fontSize.sm,
          color: tokensV2.colors.textSecondary,
          margin: 0,
        }}>
          This is how others will see you in conversations
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: tokensV2.spacing[20] }}>
        <input
          type="text"
          value={localNickname}
          onChange={(e) => setLocalNickname(e.target.value)}
          placeholder="Enter your nickname"
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

        <div style={{ display: 'flex', gap: tokensV2.spacing[12] }}>
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
            disabled={!localNickname.trim()}
            style={{
              flex: 1,
              padding: tokensV2.spacing[12],
              borderRadius: tokensV2.borderRadius.medium,
              background: localNickname.trim() ? tokensV2.gradients.primary : tokensV2.colors.borderLight,
              color: tokensV2.colors.textOnDark,
              fontSize: tokensV2.typography.fontSize.base,
              fontWeight: tokensV2.typography.fontWeight.semibold,
              border: 'none',
              cursor: localNickname.trim() ? 'pointer' : 'not-allowed',
              opacity: localNickname.trim() ? 1 : 0.5,
            }}
          >
            Continue
          </motion.button>
        </div>
      </form>
    </motion.div>
  )
}

