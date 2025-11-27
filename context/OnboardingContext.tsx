"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { useAuth } from "@/hooks/use-auth"
import { OnboardingStep, normalizeOnboardingStep, STEP_ORDER } from "@/lib/onboarding"

interface OnboardingState {
  step: OnboardingStep
  email: string
  password: string
  firstName: string
  lastName: string
  questionsAnswers: Record<string, string>
  interests: string[]
  loading: boolean
  error: string | null
  initialized: boolean
}

interface OnboardingContextType {
  state: OnboardingState
  setStep: (step: OnboardingStep) => void
  setEmail: (email: string) => void
  setPassword: (password: string) => void
  setFirstName: (firstName: string) => void
  setLastName: (lastName: string) => void
  setQuestionsAnswers: (answers: Record<string, string>) => void
  setQuestionAnswer: (questionId: string, answer: string) => void
  setInterests: (interests: string[]) => void
  saveProgress: (
    step?: OnboardingStep,
    options?: {
      firstName?: string
      lastName?: string
      questionsAnswers?: Record<string, string>
      interests?: string[]
      email?: string
    }
  ) => Promise<boolean>
  initialize: () => Promise<void>
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [state, setState] = useState<OnboardingState>({
    step: 'email',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    questionsAnswers: {},
    interests: [],
    loading: false,
    error: null,
    initialized: false,
  })

  // Initialize from database - NON-BLOCKING with timeout
  // Never blocks onboarding progress - always initializes quickly
  const initialize = useCallback(async () => {
    if (authLoading || !user) {
      setState(prev => ({ ...prev, initialized: true }))
      return
    }

    try {
      // Add timeout to prevent hanging (3 seconds max)
      // If API is slow or circuit breaker is active, don't wait
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      
      const response = await fetch(`/api/users?userId=${user.id}`, {
        signal: controller.signal,
        cache: 'no-store'
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        // API error - don't block, but preserve current step if user is already ahead
        console.warn('[OnboardingContext] Initialize API error:', response.status)
        setState(prev => ({
          ...prev,
          // Only reset to 'email' if we're already at 'email' or 'start'
          // If user is on a later step, preserve it (prevents email loop)
          step: (prev.step === 'email' || prev.step === 'start') ? 'email' : prev.step,
          initialized: true,
          error: null,
        }))
        return
      }

      const data = await response.json()

      if (data.success && data.data) {
        const dbUser = data.data
        const dbStep = normalizeOnboardingStep(dbUser.onboarding_step)

        setState(prev => {
          // CRITICAL: Never reset to 'email' if user is already on a later step
          // This prevents the email loop when DB is stale or hasn't propagated
          let finalStep = dbStep
          if (dbStep === 'email' && prev.step !== 'email' && prev.step !== 'start') {
            console.log('[OnboardingContext] ⚠️ DB says "email" but user is on', prev.step, '- preserving current step (preventing email loop)')
            finalStep = prev.step // Preserve current step
          } else if (dbStep !== 'email' && dbStep !== 'start') {
            // If DB has a later step, use it (user progressed)
            finalStep = dbStep
          } else if (prev.step !== 'email' && prev.step !== 'start') {
            // If DB says 'email' but user is ahead, preserve user's step
            finalStep = prev.step
          }
          
          return {
            ...prev,
            step: finalStep,
            email: dbUser.email || '',
            firstName: dbUser.first_name || '',
            lastName: dbUser.last_name || '',
            questionsAnswers: (dbUser.questions_answers as Record<string, string>) || {},
            interests: dbUser.interests || [],
            initialized: true,
            error: null,
          }
        })
      } else {
        // No user data - but preserve current step if user is already ahead
        setState(prev => ({
          ...prev,
          // Only reset to 'email' if we're already at 'email' or 'start'
          // If user is on a later step, preserve it (prevents email loop)
          step: (prev.step === 'email' || prev.step === 'start') ? 'email' : prev.step,
          initialized: true,
          error: null,
        }))
      }
    } catch (error: any) {
      // Timeout or network error - don't block onboarding
      if (error.name === 'AbortError') {
        console.warn('[OnboardingContext] Initialize timeout - using default state')
      } else {
        console.error('[OnboardingContext] Initialize error:', error)
      }
      // Always initialize to allow onboarding to proceed
      // But preserve current step if user is already ahead (prevents email loop)
      setState(prev => ({
        ...prev,
        // Only reset to 'email' if we're already at 'email' or 'start'
        // If user is on a later step, preserve it (prevents email loop)
        step: (prev.step === 'email' || prev.step === 'start') ? 'email' : prev.step,
        initialized: true,
        error: null,
      }))
    }
  }, [user, authLoading])

  // Save progress to database - ALWAYS non-blocking
  // This function NEVER blocks navigation - saves happen in background
  const saveProgress = useCallback(async (
    step?: OnboardingStep,
    options?: {
      firstName?: string
      lastName?: string
      questionsAnswers?: Record<string, string>
      interests?: string[]
      email?: string
    }
  ): Promise<boolean> => {
    // Update local state immediately (synchronous)
    if (step) {
      setState(prev => ({ ...prev, step, error: null }))
    }

    // If no user ID, queue save for later - don't block
    if (!user?.id) {
      console.warn('[OnboardingContext] Cannot save: user ID is missing, will retry after auth')
      return true // Always return true to allow navigation
    }

    // Use provided values or fall back to current state
    // This prevents stale closure issues when setTimeout executes
    const firstName = options?.firstName !== undefined ? options.firstName : state.firstName
    const lastName = options?.lastName !== undefined ? options.lastName : state.lastName
    const questionsAnswers = options?.questionsAnswers !== undefined ? options.questionsAnswers : state.questionsAnswers
    const interests = options?.interests !== undefined ? options.interests : state.interests
    const email = options?.email !== undefined ? options.email : state.email

    // Save in background - don't set loading state (non-blocking)
    // Use setTimeout to ensure this doesn't block the current execution
    setTimeout(async () => {
      try {
        const stepToSave = step || state.step
        const isComplete = stepToSave === 'complete'

        const response = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            questionsAnswers: Object.keys(questionsAnswers).length > 0 ? questionsAnswers : undefined,
            interests: interests.length > 0 ? interests : undefined,
            onboarding_step: stepToSave,
            onboarding_completed: isComplete,
            email: email || undefined,
          }),
        })

        const data = await response.json()

        if (!data.success) {
          // Log error but don't show to user (non-critical)
          const errorMsg = data.error || 'Failed to save progress'
          console.error('[OnboardingContext] Background save failed:', errorMsg)
          // Don't update state.error - this is background, user shouldn't see it
        } else {
          // Success - silently update state
          setState(prev => ({ ...prev, error: null }))
        }
      } catch (error: any) {
        // Silently fail - this is background save
        console.error('[OnboardingContext] Background save error:', error)
      }
    }, 0)

    // Always return true immediately - never block navigation
    return true
  }, [user, state.step, state.firstName, state.lastName, state.questionsAnswers, state.interests, state.email])

  // Initialize on mount
  useEffect(() => {
    if (!state.initialized && !authLoading) {
      initialize()
    }
  }, [state.initialized, authLoading, initialize])

  // Retry saving progress when user becomes available
  useEffect(() => {
    if (user?.id && state.initialized && !state.loading) {
      // If we have unsaved progress (step is ahead of what's saved), try to save it
      // This handles the case where user wasn't authenticated during earlier steps
      const retrySave = async () => {
        try {
          const response = await fetch(`/api/users?userId=${user.id}`)
          const data = await response.json()
          
          if (data.success && data.data) {
            const dbStep = normalizeOnboardingStep(data.data.onboarding_step)
            const currentStepIndex = STEP_ORDER.indexOf(state.step)
            const dbStepIndex = STEP_ORDER.indexOf(dbStep)
            
            // If current step is ahead of saved step, save it in background
            if (currentStepIndex > dbStepIndex) {
              // Save in background - don't await
              saveProgress(state.step).catch((error) => {
                console.log('[OnboardingContext] Background save retry failed:', error)
              })
            }
          }
        } catch (error) {
          // Silently fail - this is just a background sync
          console.log('[OnboardingContext] Background save retry failed:', error)
        }
      }
      
      // Debounce the retry
      const timeout = setTimeout(retrySave, 1000)
      return () => clearTimeout(timeout)
    }
  }, [user?.id, state.initialized, state.step, state.loading, saveProgress])

  const setStep = useCallback((step: OnboardingStep) => {
    setState(prev => ({ ...prev, step, error: null }))
  }, [])

  const setEmail = useCallback((email: string) => {
    setState(prev => ({ ...prev, email, error: null }))
  }, [])

  const setPassword = useCallback((password: string) => {
    setState(prev => ({ ...prev, password, error: null }))
  }, [])

  const setFirstName = useCallback((firstName: string) => {
    setState(prev => ({ ...prev, firstName, error: null }))
  }, [])

  const setLastName = useCallback((lastName: string) => {
    setState(prev => ({ ...prev, lastName, error: null }))
  }, [])

  const setQuestionsAnswers = useCallback((answers: Record<string, string>) => {
    setState(prev => ({ ...prev, questionsAnswers: answers, error: null }))
  }, [])

  const setQuestionAnswer = useCallback((questionId: string, answer: string) => {
    setState(prev => ({
      ...prev,
      questionsAnswers: { ...prev.questionsAnswers, [questionId]: answer },
      error: null,
    }))
  }, [])

  const setInterests = useCallback((interests: string[]) => {
    setState(prev => ({ ...prev, interests, error: null }))
  }, [])

  return (
    <OnboardingContext.Provider
      value={{
        state,
        setStep,
        setEmail,
        setPassword,
        setFirstName,
        setLastName,
        setQuestionsAnswers,
        setQuestionAnswer,
        setInterests,
        saveProgress,
        initialize,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}

