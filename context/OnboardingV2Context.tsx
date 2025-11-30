"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export type OnboardingStepV2 = 
  | 'welcome'
  | 'email'
  | 'password'
  | 'name'
  | 'questions'
  | 'interests'
  | 'permissions'
  | 'create-account'

const STEP_ORDER: OnboardingStepV2[] = [
  'welcome',
  'email',
  'password',
  'name',
  'questions',
  'interests',
  'permissions',
  'create-account',
]

interface OnboardingV2State {
  step: OnboardingStepV2
  email: string
  password: string
  passwordConfirm: string
  firstName: string
  lastName: string
  questionAnswers: Record<string, string> // { questionId: answerValue }
  interests: string[] // Array of interest IDs
  notificationsEnabled: boolean
  cameraEnabled: boolean
  microphoneEnabled: boolean
  initialized: boolean
  loading: boolean
  error: string | null
}

interface OnboardingV2ContextType {
  state: OnboardingV2State
  setStep: (step: OnboardingStepV2) => void
  setEmail: (email: string) => void
  setPassword: (password: string) => void
  setPasswordConfirm: (passwordConfirm: string) => void
  setFirstName: (firstName: string) => void
  setLastName: (lastName: string) => void
  setQuestionAnswer: (questionId: string, answerValue: string) => void
  setInterests: (interests: string[]) => void
  setNotificationsEnabled: (enabled: boolean) => void
  setCameraEnabled: (enabled: boolean) => void
  setMicrophoneEnabled: (enabled: boolean) => void
  nextStep: () => void
  previousStep: () => void
  createAccount: () => Promise<{ success: boolean; userId?: string; error?: string }>
}

const initialState: OnboardingV2State = {
  step: 'welcome',
  email: '',
  password: '',
  passwordConfirm: '',
  firstName: '',
  lastName: '',
  questionAnswers: {},
  interests: [],
  notificationsEnabled: false,
  cameraEnabled: false,
  microphoneEnabled: false,
  initialized: false,
  loading: false,
  error: null,
}

const OnboardingV2Context = createContext<OnboardingV2ContextType | undefined>(undefined)

export function OnboardingV2Provider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingV2State>(initialState)

  const setStep = useCallback((step: OnboardingStepV2) => {
    setState(prev => ({ ...prev, step }))
  }, [])

  const setEmail = useCallback((email: string) => {
    setState(prev => ({ ...prev, email }))
  }, [])

  const setPassword = useCallback((password: string) => {
    setState(prev => ({ ...prev, password }))
  }, [])

  const setPasswordConfirm = useCallback((passwordConfirm: string) => {
    setState(prev => ({ ...prev, passwordConfirm }))
  }, [])

  const setFirstName = useCallback((firstName: string) => {
    setState(prev => ({ ...prev, firstName }))
  }, [])

  const setLastName = useCallback((lastName: string) => {
    setState(prev => ({ ...prev, lastName }))
  }, [])

  const setQuestionAnswer = useCallback((questionId: string, answerValue: string) => {
    setState(prev => ({
      ...prev,
      questionAnswers: {
        ...prev.questionAnswers,
        [questionId]: answerValue,
      },
    }))
  }, [])

  const setInterests = useCallback((interests: string[]) => {
    setState(prev => ({ ...prev, interests }))
  }, [])

  const setNotificationsEnabled = useCallback((notificationsEnabled: boolean) => {
    setState(prev => ({ ...prev, notificationsEnabled }))
  }, [])

  const setCameraEnabled = useCallback((cameraEnabled: boolean) => {
    setState(prev => ({ ...prev, cameraEnabled }))
  }, [])

  const setMicrophoneEnabled = useCallback((microphoneEnabled: boolean) => {
    setState(prev => ({ ...prev, microphoneEnabled }))
  }, [])

  const setNotificationsEnabled = useCallback((notificationsEnabled: boolean) => {
    setState(prev => ({ ...prev, notificationsEnabled }))
  }, [])

  const setCameraEnabled = useCallback((cameraEnabled: boolean) => {
    setState(prev => ({ ...prev, cameraEnabled }))
  }, [])

  const setMicrophoneEnabled = useCallback((microphoneEnabled: boolean) => {
    setState(prev => ({ ...prev, microphoneEnabled }))
  }, [])

  const nextStep = useCallback(() => {
    setState(prev => {
      const currentIndex = STEP_ORDER.indexOf(prev.step)
      if (currentIndex < STEP_ORDER.length - 1) {
        return { ...prev, step: STEP_ORDER[currentIndex + 1] }
      }
      return prev
    })
  }, [])

  const previousStep = useCallback(() => {
    setState(prev => {
      const currentIndex = STEP_ORDER.indexOf(prev.step)
      if (currentIndex > 0) {
        return { ...prev, step: STEP_ORDER[currentIndex - 1] }
      }
      return prev
    })
  }, [])

  const createAccount = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Generate username: "FirstName LastInitial" (e.g., "Sarah J")
      const username = `${state.firstName} ${state.lastName[0]?.toUpperCase() || ''}`.trim()

      // Create account via Supabase Auth
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing')
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: state.email,
        password: state.password,
      })

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Failed to create account')
      }

      const userId = authData.user.id

      // Complete onboarding and save all data
      const response = await fetch('/api/onboarding-v2/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: state.email,
          firstName: state.firstName,
          lastName: state.lastName,
          username,
          questionAnswers: state.questionAnswers,
          interests: state.interests,
          notificationsEnabled: state.notificationsEnabled,
          cameraEnabled: state.cameraEnabled,
          microphoneEnabled: state.microphoneEnabled,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to complete onboarding')
      }

      const data = await response.json()
      
      if (data.success) {
        setState(prev => ({ ...prev, loading: false }))
        return { success: true, userId }
      } else {
        throw new Error(data.error || 'Failed to complete onboarding')
      }
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Failed to create account' 
      }))
      return { success: false, error: error.message || 'Failed to create account' }
    }
  }, [state])

  return (
    <OnboardingV2Context.Provider
      value={{
        state,
        setStep,
        setEmail,
        setPassword,
        setPasswordConfirm,
        setFirstName,
        setLastName,
        setQuestionAnswer,
        setInterests,
        setNotificationsEnabled,
        setCameraEnabled,
        setMicrophoneEnabled,
        nextStep,
        previousStep,
        createAccount,
      }}
    >
      {children}
    </OnboardingV2Context.Provider>
  )
}

export function useOnboardingV2() {
  const context = useContext(OnboardingV2Context)
  if (context === undefined) {
    throw new Error('useOnboardingV2 must be used within OnboardingV2Provider')
  }
  return context
}
