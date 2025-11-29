"use client"

import { motion } from 'framer-motion'
import { useOnboardingV2 } from '@/context/OnboardingV2Context'
import { tokensV2, animations } from '@/lib/design-tokens-v2'
import { INTERESTS, getInterestsByCategory, INTEREST_CATEGORIES } from '@/lib/interests'

export function InterestsStep() {
  const { state, setInterests, nextStep, previousStep } = useOnboardingV2()

  const toggleInterest = (interestId: string) => {
    const current = state.interests
    if (current.includes(interestId)) {
      setInterests(current.filter(id => id !== interestId))
    } else {
      setInterests([...current, interestId])
    }
  }

  const trendingInterests = getInterestsByCategory(INTEREST_CATEGORIES.TRENDING)
  const menInterests = getInterestsByCategory(INTEREST_CATEGORIES.MEN)
  const womenInterests = getInterestsByCategory(INTEREST_CATEGORIES.WOMEN)

  return (
    <motion.div
      {...animations.fadeUp}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: tokensV2.spacing[24],
        maxHeight: '70vh',
        overflowY: 'auto',
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
          What are you interested in?
        </h1>
        <p style={{
          fontSize: tokensV2.typography.fontSize.sm,
          color: tokensV2.colors.textSecondary,
          margin: 0,
        }}>
          Select all that apply
        </p>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: tokensV2.spacing[24],
      }}>
        {/* Trending */}
        <div>
          <h2 style={{
            fontSize: tokensV2.typography.fontSize.base,
            fontWeight: tokensV2.typography.fontWeight.semibold,
            color: tokensV2.colors.textPrimary,
            margin: 0,
            marginBottom: tokensV2.spacing[12],
          }}>
            Trending
          </h2>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: tokensV2.spacing[8],
          }}>
            {trendingInterests.map((interest) => {
              const isSelected = state.interests.includes(interest.id)
              return (
                <motion.button
                  key={interest.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleInterest(interest.id)}
                  style={{
                    padding: `${tokensV2.spacing[8]} ${tokensV2.spacing[16]}`,
                    borderRadius: tokensV2.borderRadius.full,
                    border: `1px solid ${isSelected ? tokensV2.colors.gradientStart : tokensV2.colors.borderLight}`,
                    background: isSelected ? tokensV2.gradients.subtle : tokensV2.colors.backgroundWhite,
                    color: tokensV2.colors.textPrimary,
                    fontSize: tokensV2.typography.fontSize.sm,
                    fontWeight: isSelected ? tokensV2.typography.fontWeight.semibold : tokensV2.typography.fontWeight.regular,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: tokensV2.spacing[4],
                    whiteSpace: 'nowrap',
                  }}
                >
                  {interest.emoji && <span>{interest.emoji}</span>}
                  <span>{interest.label}</span>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* For Men */}
        <div>
          <h2 style={{
            fontSize: tokensV2.typography.fontSize.base,
            fontWeight: tokensV2.typography.fontWeight.semibold,
            color: tokensV2.colors.textPrimary,
            margin: 0,
            marginBottom: tokensV2.spacing[12],
          }}>
            For Men
          </h2>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: tokensV2.spacing[8],
          }}>
            {menInterests.map((interest) => {
              const isSelected = state.interests.includes(interest.id)
              return (
                <motion.button
                  key={interest.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleInterest(interest.id)}
                  style={{
                    padding: `${tokensV2.spacing[8]} ${tokensV2.spacing[16]}`,
                    borderRadius: tokensV2.borderRadius.full,
                    border: `1px solid ${isSelected ? tokensV2.colors.gradientStart : tokensV2.colors.borderLight}`,
                    background: isSelected ? tokensV2.gradients.subtle : tokensV2.colors.backgroundWhite,
                    color: tokensV2.colors.textPrimary,
                    fontSize: tokensV2.typography.fontSize.sm,
                    fontWeight: isSelected ? tokensV2.typography.fontWeight.semibold : tokensV2.typography.fontWeight.regular,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: tokensV2.spacing[4],
                    whiteSpace: 'nowrap',
                  }}
                >
                  {interest.emoji && <span>{interest.emoji}</span>}
                  <span>{interest.label}</span>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* For Women */}
        <div>
          <h2 style={{
            fontSize: tokensV2.typography.fontSize.base,
            fontWeight: tokensV2.typography.fontWeight.semibold,
            color: tokensV2.colors.textPrimary,
            margin: 0,
            marginBottom: tokensV2.spacing[12],
          }}>
            For Women
          </h2>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: tokensV2.spacing[8],
          }}>
            {womenInterests.map((interest) => {
              const isSelected = state.interests.includes(interest.id)
              return (
                <motion.button
                  key={interest.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleInterest(interest.id)}
                  style={{
                    padding: `${tokensV2.spacing[8]} ${tokensV2.spacing[16]}`,
                    borderRadius: tokensV2.borderRadius.full,
                    border: `1px solid ${isSelected ? tokensV2.colors.gradientStart : tokensV2.colors.borderLight}`,
                    background: isSelected ? tokensV2.gradients.subtle : tokensV2.colors.backgroundWhite,
                    color: tokensV2.colors.textPrimary,
                    fontSize: tokensV2.typography.fontSize.sm,
                    fontWeight: isSelected ? tokensV2.typography.fontWeight.semibold : tokensV2.typography.fontWeight.regular,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: tokensV2.spacing[4],
                    whiteSpace: 'nowrap',
                  }}
                >
                  {interest.emoji && <span>{interest.emoji}</span>}
                  <span>{interest.label}</span>
                </motion.button>
              )
            })}
          </div>
        </div>
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
          Create Account
        </motion.button>
      </div>
    </motion.div>
  )
}

