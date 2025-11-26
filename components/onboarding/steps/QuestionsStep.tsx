"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { AnimatedButton } from "@/components/ui/animated-button"
import { tokens } from "@/lib/design-tokens"
import { ChevronLeft } from "lucide-react"
import { ONBOARDING_QUESTIONS, type OnboardingQuestion } from "@/lib/onboarding-questions"

interface QuestionsStepProps {
  answers: Record<string, string>
  onAnswerChange: (questionId: string, answer: string) => void
  onSubmit: (answers: Record<string, string>) => Promise<void>
  loading: boolean
  error: string | null
  onBack?: () => void
}

export function QuestionsStep({ answers, onAnswerChange, onSubmit, loading, error, onBack }: QuestionsStepProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>(answers)

  const currentQuestion = ONBOARDING_QUESTIONS[currentQuestionIndex]
  const currentAnswer = localAnswers[currentQuestion.id] || ""

  // Update local answers when prop changes
  useEffect(() => {
    setLocalAnswers(answers)
  }, [answers])

  const handleAnswerChange = (value: string) => {
    const newAnswers = { ...localAnswers, [currentQuestion.id]: value }
    setLocalAnswers(newAnswers)
    onAnswerChange(currentQuestion.id, value)
  }

  const handleNext = () => {
    if (currentQuestionIndex < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // Last question - submit
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmit = () => {
    // Validate all questions are answered
    const allAnswered = ONBOARDING_QUESTIONS.every(q => localAnswers[q.id]?.trim())
    if (!allAnswered) {
      // Find first unanswered question
      const firstUnanswered = ONBOARDING_QUESTIONS.findIndex(q => !localAnswers[q.id]?.trim())
      if (firstUnanswered !== -1) {
        setCurrentQuestionIndex(firstUnanswered)
      }
      return
    }
    // Call onSubmit but don't await - navigation happens immediately
    onSubmit(localAnswers).catch((error) => {
      console.error('[QuestionsStep] Submit error:', error)
    })
  }

  const canGoNext = currentAnswer.trim().length > 0
  const progress = ((currentQuestionIndex + 1) / ONBOARDING_QUESTIONS.length) * 100

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: tokens.spacing[20],
      width: '100%',
      maxWidth: '600px',
      margin: '0 auto',
    }}>
      <div>
        <h1 style={{
          ...tokens.typography.title,
          color: tokens.colors.textPrimaryOnDark,
          margin: 0,
          marginBottom: tokens.spacing[8],
          textAlign: 'center',
        }}>
          {currentQuestion.question}
        </h1>
        <p style={{
          ...tokens.typography.body,
          color: tokens.colors.textSecondary,
          margin: 0,
          marginBottom: tokens.spacing[16],
          textAlign: 'center',
        }}>
          Question {currentQuestionIndex + 1} of {ONBOARDING_QUESTIONS.length}
        </p>
        
        {/* Progress bar */}
        <div style={{
          width: '100%',
          height: '4px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: tokens.spacing[8],
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: tokens.colors.surface1,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[16] }}>
        <div>
          <Input
            type="text"
            placeholder={currentQuestion.placeholder || "Your answer..."}
            value={currentAnswer}
            onChange={(e) => {
              const value = currentQuestion.maxLength 
                ? e.target.value.slice(0, currentQuestion.maxLength)
                : e.target.value
              handleAnswerChange(value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canGoNext && !loading) {
                handleNext()
              }
            }}
            disabled={loading}
            autoFocus
            style={{
              minHeight: '60px',
            }}
          />
          {currentQuestion.maxLength && (
            <p style={{
              ...tokens.typography.label,
              color: tokens.colors.textSecondary,
              margin: 0,
              marginTop: tokens.spacing[8],
              textAlign: 'right',
              fontSize: '12px',
            }}>
              {currentAnswer.length} / {currentQuestion.maxLength}
            </p>
          )}
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
      </div>

      <div style={{ display: 'flex', gap: tokens.spacing[16] }}>
        {currentQuestionIndex > 0 ? (
          <AnimatedButton
            variant="ghost"
            onClick={handlePrevious}
            disabled={loading}
            style={{ flex: 1 }}
          >
            <ChevronLeft style={{ width: '16px', height: '16px' }} />
          </AnimatedButton>
        ) : onBack ? (
          <AnimatedButton
            variant="ghost"
            onClick={onBack}
            disabled={loading}
            style={{ flex: 1 }}
          >
            <ChevronLeft style={{ width: '16px', height: '16px' }} />
          </AnimatedButton>
        ) : (
          <div style={{ flex: 1 }} />
        )}
        <AnimatedButton
          onClick={handleNext}
          disabled={!canGoNext || loading}
          style={{ flex: 1 }}
        >
          {currentQuestionIndex < ONBOARDING_QUESTIONS.length - 1 
            ? 'Next' 
            : loading 
              ? 'Saving...' 
              : 'Continue'}
        </AnimatedButton>
      </div>
    </div>
  )
}

