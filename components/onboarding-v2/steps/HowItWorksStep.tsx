"use client"

import { motion } from 'framer-motion'
import { useOnboardingV2 } from '@/context/OnboardingV2Context'
import { tokensV2, animations } from '@/lib/design-tokens-v2'

const STEPS = [
  { emoji: '🎯', title: 'Choose Your Mood', description: 'Select how you&apos;re feeling' },
  { emoji: '💭', title: 'Set Your Intention', description: 'What do you want to do?' },
  { emoji: '📚', title: 'Pick a Topic', description: 'What interests you?' },
  { emoji: '✨', title: 'Find a Match', description: 'Connect with like-minded people' },
]

export function HowItWorksStep() {
  const { nextStep, previousStep } = useOnboardingV2()

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
          How Narrative Works
        </h1>
        <p style={{
          fontSize: tokensV2.typography.fontSize.sm,
          color: tokensV2.colors.textSecondary,
          margin: 0,
        }}>
          Simple steps to meaningful connections
        </p>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: tokensV2.spacing[16],
      }}>
        {STEPS.map((step, index) => (
          <div
            key={index}
            style={{
              padding: tokensV2.spacing[20],
              borderRadius: tokensV2.borderRadius.medium,
              background: tokensV2.colors.backgroundEggshell,
              border: `1px solid ${tokensV2.colors.borderLight}`,
              display: 'flex',
              alignItems: 'center',
              gap: tokensV2.spacing[16],
            }}
          >
            <span style={{ fontSize: '32px' }}>{step.emoji}</span>
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontSize: tokensV2.typography.fontSize.lg,
                fontWeight: tokensV2.typography.fontWeight.semibold,
                color: tokensV2.colors.textPrimary,
                margin: 0,
                marginBottom: tokensV2.spacing[4],
              }}>
              {step.title}
            </h3>
            <p style={{
              fontSize: tokensV2.typography.fontSize.sm,
              color: tokensV2.colors.textSecondary,
              margin: 0,
            }}>
              {step.description}
            </p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: tokensV2.spacing[12], marginTop: tokensV2.spacing[8] }}>
        <motion.button
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
          whileTap={{ scale: 0.95 }}
          onClick={nextStep}
          style={{
            flex: 1,
            padding: tokensV2.spacing[12],
            borderRadius: tokensV2.borderRadius.medium,
            background: tokensV2.gradients.primary,
            color: tokensV2.colors.textOnDark,
            fontSize: tokensV2.typography.fontSize.base,
            fontWeight: tokensV2.typography.fontWeight.semibold,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Continue
        </motion.button>
      </div>
    </motion.div>
  )
}

