"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { AnimatedButton } from "@/components/ui/animated-button"
import { tokens } from "@/lib/design-tokens"
import { PERSONALITY_QUESTIONS } from "@/lib/personality-questions"
import { ChevronLeft } from "lucide-react"

interface PersonalityStepProps {
  answers: Record<string, string | string[]>
  onAnswersChange: (answers: Record<string, string | string[]>) => void
  onSubmit: (answers: Record<string, string | string[]>) => Promise<void>
  onSkip: () => void
  loading: boolean
  error: string | null
  onBack?: () => void
}

export function PersonalityStep({ 
  answers, 
  onAnswersChange, 
  onSubmit, 
  onSkip,
  loading, 
  error,
  onBack 
}: PersonalityStepProps) {
  const [localAnswers, setLocalAnswers] = useState<Record<string, string | string[]>>(answers)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  useEffect(() => {
    setLocalAnswers(answers)
  }, [answers])

  const questions = PERSONALITY_QUESTIONS
  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const selectedAnswer = localAnswers[currentQuestion.id]

  const handleAnswer = (value: string) => {
    const newAnswers = { ...localAnswers }
    
    if (currentQuestion.id === 'social_intention') {
      // Multi-select for social_intention
      const currentArray = Array.isArray(newAnswers[currentQuestion.id]) 
        ? (newAnswers[currentQuestion.id] as string[])
        : []
      const newArray = currentArray.includes(value)
        ? currentArray.filter(v => v !== value)
        : [...currentArray, value]
      newAnswers[currentQuestion.id] = newArray
    } else {
      // Single select
      newAnswers[currentQuestion.id] = value
    }
    
    setLocalAnswers(newAnswers)
    onAnswersChange(newAnswers)
  }

  const handleNext = () => {
    if (isLastQuestion) {
      // Submit all answers
      onSubmit(localAnswers)
    } else {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    } else if (onBack) {
      onBack()
    }
  }

  const canProceed = currentQuestion.id === 'social_intention'
    ? Array.isArray(selectedAnswer) && (selectedAnswer as string[]).length > 0
    : !!selectedAnswer

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: tokens.spacing[20],
      minHeight: '400px',
    }}>
      <div>
        <p style={{
          ...tokens.typography.label,
          color: tokens.colors.textSecondary,
          margin: 0,
          marginBottom: tokens.spacing[8],
          textAlign: 'center',
        }}>
          Question {currentQuestionIndex + 1} of {questions.length}
        </p>
        <h1 style={{
          ...tokens.typography.title,
          color: tokens.colors.textPrimaryOnDark,
          margin: 0,
          marginBottom: tokens.spacing[8],
          textAlign: 'center',
        }}>
          {currentQuestion.question}
        </h1>
        {currentQuestion.description && (
          <p style={{
            ...tokens.typography.body,
            color: tokens.colors.textSecondary,
            margin: 0,
            textAlign: 'center',
          }}>
            {currentQuestion.description}
          </p>
        )}
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacing[12],
        flex: 1,
        overflowY: 'auto',
      }}>
        {currentQuestion.options.map(option => {
          const isSelected = currentQuestion.id === 'social_intention'
            ? Array.isArray(selectedAnswer) && (selectedAnswer as string[]).includes(option.value)
            : selectedAnswer === option.value

          return (
            <motion.button
              key={option.value}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAnswer(option.value)}
              disabled={loading}
              style={{
                width: '100%',
                minHeight: '50px',
                padding: `${tokens.spacing[12]} ${tokens.spacing[16]}`,
                borderRadius: tokens.radii.pill,
                background: isSelected ? tokens.colors.surface2 : tokens.colors.surface1,
                border: 'none',
                color: tokens.colors.textOnPill,
                boxShadow: isSelected ? tokens.shadows.pillSelected : tokens.shadows.pillUnselected,
                fontSize: '14px',
                fontWeight: isSelected ? 500 : 400,
                textAlign: 'left',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: tokens.spacing[8],
              }}
            >
              {option.emoji && <span style={{ fontSize: '20px' }}>{option.emoji}</span>}
              <span style={{ fontWeight: isSelected ? 600 : 500 }}>
                {option.label}
              </span>
            </motion.button>
          )
        })}
      </div>

      {error && (
        <p style={{
          ...tokens.typography.label,
          color: '#EF4444',
          margin: 0,
          textAlign: 'center',
        }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: tokens.spacing[16] }}>
        <AnimatedButton
          variant="ghost"
          onClick={handleBack}
          disabled={loading}
          style={{ flex: 1 }}
        >
          <ChevronLeft style={{ width: '16px', height: '16px' }} />
        </AnimatedButton>
        <AnimatedButton
          onClick={handleNext}
          disabled={!canProceed || loading}
          style={{ flex: 1 }}
        >
          {loading ? 'Saving...' : isLastQuestion ? 'Complete' : 'Next'}
        </AnimatedButton>
      </div>

      {isLastQuestion && (
        <AnimatedButton
          variant="ghost"
          onClick={onSkip}
          disabled={loading}
          style={{ width: '100%' }}
        >
          Skip personality (optional)
        </AnimatedButton>
      )}
    </div>
  )
}

