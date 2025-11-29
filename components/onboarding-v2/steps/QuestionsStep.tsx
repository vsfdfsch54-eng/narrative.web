"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useOnboardingV2 } from '@/context/OnboardingV2Context'
import { tokensV2, animations } from '@/lib/design-tokens-v2'
import { ONBOARDING_QUESTIONS, getAllQuestionIds, validateAllQuestionsAnswered } from '@/lib/onboarding-questions'

export function QuestionsStep() {
  const { state, setQuestionAnswer, nextStep, previousStep } = useOnboardingV2()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const questionIds = getAllQuestionIds()
  const currentQuestion = ONBOARDING_QUESTIONS[currentQuestionIndex]

  // Initialize answers if not set
  useEffect(() => {
    questionIds.forEach(id => {
      if (!state.questionAnswers[id]) {
        setQuestionAnswer(id, '')
      }
    })
  }, [])

  const handleAnswer = (answerValue: string) => {
    setQuestionAnswer(currentQuestion.id, answerValue)
    
    // Auto-advance to next question after a short delay
    setTimeout(() => {
      if (currentQuestionIndex < questionIds.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      }
    }, 300)
  }

  const handleNext = () => {
    if (currentQuestionIndex < questionIds.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // Validate all questions answered
      const validation = validateAllQuestionsAnswered(state.questionAnswers)
      if (validation.valid) {
        nextStep()
      }
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    } else {
      previousStep()
    }
  }

  const allAnswered = validateAllQuestionsAnswered(state.questionAnswers).valid
  const currentAnswer = state.questionAnswers[currentQuestion.id]

  return (
    <motion.div
      {...animations.fadeUp}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: tokensV2.spacing[24],
      }}
    >
      {/* Progress */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: tokensV2.spacing[8],
        marginBottom: tokensV2.spacing[8],
      }}>
        <div style={{
          flex: 1,
          height: '4px',
          background: tokensV2.colors.borderLight,
          borderRadius: tokensV2.borderRadius.full,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${((currentQuestionIndex + 1) / questionIds.length) * 100}%`,
            height: '100%',
            background: tokensV2.gradients.primary,
            transition: 'width 0.3s ease',
          }} />
        </div>
        <span style={{
          fontSize: tokensV2.typography.fontSize.sm,
          color: tokensV2.colors.textSecondary,
          whiteSpace: 'nowrap',
        }}>
          {currentQuestionIndex + 1} / {questionIds.length}
        </span>
      </div>

      <div>
        <h1 style={{
          fontSize: tokensV2.typography.fontSize['2xl'],
          fontWeight: tokensV2.typography.fontWeight.bold,
          color: tokensV2.colors.textPrimary,
          margin: 0,
          marginBottom: tokensV2.spacing[8],
        }}>
          {currentQuestion.question}
        </h1>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: tokensV2.spacing[12],
      }}>
        {currentQuestion.options.map((option) => {
          const isSelected = currentAnswer === option.value
          return (
            <motion.button
              key={option.value}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAnswer(option.value)}
              style={{
                padding: tokensV2.spacing[16],
                borderRadius: tokensV2.borderRadius.medium,
                border: `2px solid ${isSelected ? tokensV2.colors.gradientStart : tokensV2.colors.borderLight}`,
                background: isSelected ? tokensV2.gradients.subtle : tokensV2.colors.backgroundWhite,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: tokensV2.spacing[12],
                textAlign: 'left',
                boxShadow: isSelected ? tokensV2.shadows.small : 'none',
                transition: 'all 0.2s',
              }}
            >
              {option.emoji && (
                <span style={{ fontSize: '24px' }}>{option.emoji}</span>
              )}
              <span style={{
                fontSize: tokensV2.typography.fontSize.base,
                fontWeight: isSelected ? tokensV2.typography.fontWeight.semibold : tokensV2.typography.fontWeight.regular,
                color: tokensV2.colors.textPrimary,
              }}>
                {option.label}
              </span>
            </motion.button>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: tokensV2.spacing[12], marginTop: tokensV2.spacing[8] }}>
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={handlePrevious}
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
          {currentQuestionIndex === 0 ? 'Back' : 'Previous'}
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={handleNext}
          disabled={!currentAnswer}
          style={{
            flex: 1,
            padding: tokensV2.spacing[12],
            borderRadius: tokensV2.borderRadius.medium,
            background: currentAnswer ? tokensV2.gradients.primary : tokensV2.colors.borderLight,
            color: tokensV2.colors.textOnDark,
            fontSize: tokensV2.typography.fontSize.base,
            fontWeight: tokensV2.typography.fontWeight.semibold,
            border: 'none',
            cursor: currentAnswer ? 'pointer' : 'not-allowed',
            opacity: currentAnswer ? 1 : 0.5,
          }}
        >
          {currentQuestionIndex === questionIds.length - 1 ? (allAnswered ? 'Continue' : 'Answer All') : 'Next'}
        </motion.button>
      </div>
    </motion.div>
  )
}

