"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { useAuth } from "@/hooks/use-auth"
import { OnboardingStep, normalizeOnboardingStep, STEP_ORDER } from "@/lib/onboarding"

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
    // If no user ID, we can't save yet - but don't block navigation
    // The user will be created when they authenticate
    if (!user?.id) {
      console.warn('[OnboardingContext] Cannot save: user ID is missing, will retry after auth')
      // Still update local state
      if (step) {
        setState(prev => ({ ...prev, step, error: null }))
      }
      return true // Return true to allow navigation, save will happen later
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
          email: state.email || undefined,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        // Log error but don't block navigation for non-critical errors
        const errorMsg = data.error || 'Failed to save progress'
        console.error('[OnboardingContext] Save failed:', errorMsg)
        
        // Only show error for critical failures, not for missing user (which is expected)
        if (!errorMsg.includes('not found') && !errorMsg.includes('missing')) {
          setState(prev => ({ ...prev, loading: false, error: errorMsg }))
          return false
        }
        
        // For missing user errors, just update state and continue
        setState(prev => ({ ...prev, loading: false, error: null }))
        if (step) {
          setState(prev => ({ ...prev, step, error: null }))
        }
        return true // Allow navigation even if save failed
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
      // Don't block navigation on network errors - allow user to continue
      setState(prev => ({
        ...prev,
        loading: false,
        error: null, // Don't show error to user, just log it
      }))
      if (step) {
        setState(prev => ({ ...prev, step, error: null }))
      }
      return true // Allow navigation even on error
    }
  }, [user, state.step, state.name, state.vibe, state.topic, state.timeframe, state.email])

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
            
            // If current step is ahead of saved step, save it
            if (currentStepIndex > dbStepIndex) {
              await saveProgress(state.step)
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
  }, [user?.id, state.initialized, state.step, state.loading])

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

