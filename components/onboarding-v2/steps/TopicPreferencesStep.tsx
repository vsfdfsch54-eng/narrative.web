"use client"

import { motion } from 'framer-motion'
import { useOnboardingV2 } from '@/context/OnboardingV2Context'
import { tokensV2, animations } from '@/lib/design-tokens-v2'

const TOPICS = [
  { id: 'deep-talk', emoji: '🧠', label: 'Deep Talk' },
  { id: 'music', emoji: '🎵', label: 'Music' },
  { id: 'art', emoji: '🎨', label: 'Art' },
  { id: 'relationships', emoji: '❤️', label: 'Relationships' },
  { id: 'news', emoji: '🌍', label: 'News' },
]

export function TopicPreferencesStep() {
  const { state, setTopicPreferences, nextStep, previousStep } = useOnboardingV2()

  const toggleTopic = (topicId: string) => {
    const current = state.topicPreferences
    if (current.includes(topicId)) {
      setTopicPreferences(current.filter(t => t !== topicId))
    } else {
      setTopicPreferences([...current, topicId])
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
          Topic Preferences
        </h1>
        <p style={{
          fontSize: tokensV2.typography.fontSize.sm,
          color: tokensV2.colors.textSecondary,
          margin: 0,
        }}>
          Select topics you&apos;re interested in discussing
        </p>
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: tokensV2.spacing[12],
      }}>
        {TOPICS.map((topic) => {
          const isSelected = state.topicPreferences.includes(topic.id)
          return (
            <motion.button
              key={topic.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleTopic(topic.id)}
              style={{
                padding: `${tokensV2.spacing[12]} ${tokensV2.spacing[20]}`,
                borderRadius: tokensV2.borderRadius.full,
                border: `2px solid ${isSelected ? tokensV2.colors.gradientStart : tokensV2.colors.borderLight}`,
                background: isSelected ? tokensV2.gradients.subtle : tokensV2.colors.backgroundWhite,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: tokensV2.spacing[8],
                boxShadow: isSelected ? tokensV2.shadows.small : 'none',
              }}
            >
              <span style={{ fontSize: '20px' }}>{topic.emoji}</span>
              <span style={{
                fontSize: tokensV2.typography.fontSize.base,
                fontWeight: tokensV2.typography.fontWeight.medium,
                color: tokensV2.colors.textPrimary,
              }}>
                {topic.label}
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
          disabled={state.topicPreferences.length === 0}
          style={{
            flex: 1,
            padding: tokensV2.spacing[12],
            borderRadius: tokensV2.borderRadius.medium,
            background: state.topicPreferences.length > 0 ? tokensV2.gradients.primary : tokensV2.colors.borderLight,
            color: tokensV2.colors.textOnDark,
            fontSize: tokensV2.typography.fontSize.base,
            fontWeight: tokensV2.typography.fontWeight.semibold,
            border: 'none',
            cursor: state.topicPreferences.length > 0 ? 'pointer' : 'not-allowed',
            opacity: state.topicPreferences.length > 0 ? 1 : 0.5,
          }}
        >
          Continue
        </motion.button>
      </div>
    </motion.div>
  )
}

