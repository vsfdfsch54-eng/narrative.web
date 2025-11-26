"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { useAuth } from "@/hooks/use-auth"
import { OnboardingStep, normalizeOnboardingStep } from "@/lib/onboarding"

interface OnboardingState {
  step: OnboardingStep
  email: string
  name: string
  vibe: string | null
  topic: string | null
  timeframe: number | null
  loading: boolean
  error: string | null
  initialized: boolean
}

interface OnboardingContextType {
  state: OnboardingState
  setStep: (step: OnboardingStep) => void
  setEmail: (email: string) => void
  setName: (name: string) => void
  setVibe: (vibe: string | null) => void
  setTopic: (topic: string | null) => void
  setTimeframe: (timeframe: number | null) => void
  saveProgress: (step?: OnboardingStep) => Promise<boolean>
  initialize: () => Promise<void>
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [state, setState] = useState<OnboardingState>({
    step: 'email',
    email: '',
    name: '',
    vibe: null,
    topic: null,
    timeframe: null,
    loading: false,
    error: null,
    initialized: false,
  })

  // Initialize from database
  const initialize = useCallback(async () => {
    if (authLoading || !user) {
      setState(prev => ({ ...prev, initialized: true }))
      return
    }

    try {
      const response = await fetch(`/api/users?userId=${user.id}`)
      const data = await response.json()

      if (data.success && data.data) {
        const dbUser = data.data
        const dbStep = normalizeOnboardingStep(dbUser.onboarding_step)

        setState(prev => ({
          ...prev,
          step: dbStep,
          email: dbUser.email || '',
          name: dbUser.name || '',
          vibe: dbUser.vibe || null,
          topic: dbUser.topic || null,
          timeframe: dbUser.timeframe || null,
          initialized: true,
          error: null,
        }))
      } else {
        setState(prev => ({
          ...prev,
          step: 'email',
          initialized: true,
          error: null,
        }))
      }
    } catch (error: any) {
      console.error('[OnboardingContext] Initialize error:', error)
      setState(prev => ({
        ...prev,
        step: 'email',
        initialized: true,
        error: null,
      }))
    }
  }, [user, authLoading])

  // Save progress to database
  const saveProgress = useCallback(async (step?: OnboardingStep): Promise<boolean> => {
    if (!user?.id) {
      console.error('[OnboardingContext] Cannot save: user ID is missing')
      return false
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const stepToSave = step || state.step
      const isComplete = stepToSave === 'complete'

      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: state.name || undefined,
          vibe: state.vibe || undefined,
          topic: state.topic || undefined,
          timeframe: state.timeframe || undefined,
          onboarding_step: stepToSave,
          onboarding_completed: isComplete,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        const errorMsg = data.error || 'Failed to save progress'
        setState(prev => ({ ...prev, loading: false, error: errorMsg }))
        return false
      }

      // Update local state if step was provided
      if (step) {
        setState(prev => ({ ...prev, step, loading: false, error: null }))
      } else {
        setState(prev => ({ ...prev, loading: false, error: null }))
      }

      return true
    } catch (error: any) {
      console.error('[OnboardingContext] Save error:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to save progress',
      }))
      return false
    }
  }, [user, state.step, state.name, state.vibe, state.topic, state.timeframe])

  // Initialize on mount
  useEffect(() => {
    if (!state.initialized && !authLoading) {
      initialize()
    }
  }, [state.initialized, authLoading, initialize])

  const setStep = useCallback((step: OnboardingStep) => {
    setState(prev => ({ ...prev, step, error: null }))
  }, [])

  const setEmail = useCallback((email: string) => {
    setState(prev => ({ ...prev, email, error: null }))
  }, [])

  const setName = useCallback((name: string) => {
    setState(prev => ({ ...prev, name, error: null }))
  }, [])

  const setVibe = useCallback((vibe: string | null) => {
    setState(prev => ({ ...prev, vibe, error: null }))
  }, [])

  const setTopic = useCallback((topic: string | null) => {
    setState(prev => ({ ...prev, topic, error: null }))
  }, [])

  const setTimeframe = useCallback((timeframe: number | null) => {
    setState(prev => ({ ...prev, timeframe, error: null }))
  }, [])

  return (
    <OnboardingContext.Provider
      value={{
        state,
        setStep,
        setEmail,
        setName,
        setVibe,
        setTopic,
        setTimeframe,
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

