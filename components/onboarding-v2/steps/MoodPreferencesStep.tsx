"use client"

import { motion } from 'framer-motion'
import { useOnboardingV2 } from '@/context/OnboardingV2Context'
import { tokensV2, animations } from '@/lib/design-tokens-v2'

const MOODS = [
  { id: 'happy', emoji: '😄', label: 'Happy' },
  { id: 'content', emoji: '🙂', label: 'Content' },
  { id: 'neutral', emoji: '😐', label: 'Neutral' },
  { id: 'sad', emoji: '😔', label: 'Sad' },
]

export function MoodPreferencesStep() {
  const { state, setMoodPreferences, nextStep, previousStep } = useOnboardingV2()

  const toggleMood = (moodId: string) => {
    const current = state.moodPreferences
    if (current.includes(moodId)) {
      setMoodPreferences(current.filter(m => m !== moodId))
    } else {
      setMoodPreferences([...current, moodId])
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
          Mood Preferences
        </h1>
        <p style={{
          fontSize: tokensV2.typography.fontSize.sm,
          color: tokensV2.colors.textSecondary,
          margin: 0,
        }}>
          Select the moods you&apos;re interested in connecting with
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: tokensV2.spacing[16],
      }}>
        {MOODS.map((mood) => {
          const isSelected = state.moodPreferences.includes(mood.id)
          return (
            <motion.button
              key={mood.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleMood(mood.id)}
              style={{
                padding: tokensV2.spacing[24],
                borderRadius: tokensV2.borderRadius.medium,
                border: `2px solid ${isSelected ? tokensV2.colors.gradientStart : tokensV2.colors.borderLight}`,
                background: isSelected ? tokensV2.gradients.subtle : tokensV2.colors.backgroundWhite,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: tokensV2.spacing[8],
                boxShadow: isSelected ? tokensV2.shadows.medium : 'none',
              }}
            >
              <span style={{ fontSize: '48px' }}>{mood.emoji}</span>
              <span style={{
                fontSize: tokensV2.typography.fontSize.base,
                fontWeight: tokensV2.typography.fontWeight.medium,
                color: tokensV2.colors.textPrimary,
              }}>
                {mood.label}
              </span>
            </motion.button>
          )
        })}
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
          disabled={state.moodPreferences.length === 0}
          style={{
            flex: 1,
            padding: tokensV2.spacing[12],
            borderRadius: tokensV2.borderRadius.medium,
            background: state.moodPreferences.length > 0 ? tokensV2.gradients.primary : tokensV2.colors.borderLight,
            color: tokensV2.colors.textOnDark,
            fontSize: tokensV2.typography.fontSize.base,
            fontWeight: tokensV2.typography.fontWeight.semibold,
            border: 'none',
            cursor: state.moodPreferences.length > 0 ? 'pointer' : 'not-allowed',
            opacity: state.moodPreferences.length > 0 ? 1 : 0.5,
          }}
        >
          Continue
        </motion.button>
      </div>
    </motion.div>
  )
}

