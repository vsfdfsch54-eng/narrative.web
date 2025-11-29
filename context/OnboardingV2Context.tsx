"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export type OnboardingStepV2 = 
  | 'welcome'
  | 'create-account'
  | 'nickname'
  | 'profile-basics'
  | 'mood-preferences'
  | 'intention-preferences'
  | 'topic-preferences'
  | 'how-it-works'
  | 'permissions'
  | 'youre-in'

const STEP_ORDER: OnboardingStepV2[] = [
  'welcome',
  'create-account',
  'nickname',
  'profile-basics',
  'mood-preferences',
  'intention-preferences',
  'topic-preferences',
  'how-it-works',
  'permissions',
  'youre-in',
]

interface OnboardingV2State {
  step: OnboardingStepV2
  email: string
  password: string
  nickname: string
  photoUrl: string | null
  age: number | null
  moodPreferences: string[]
  intentionPreferences: string[]
  topicPreferences: string[]
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
  setNickname: (nickname: string) => void
  setPhotoUrl: (photoUrl: string | null) => void
  setAge: (age: number | null) => void
  setMoodPreferences: (moods: string[]) => void
  setIntentionPreferences: (intentions: string[]) => void
  setTopicPreferences: (topics: string[]) => void
  setNotificationsEnabled: (enabled: boolean) => void
  setCameraEnabled: (enabled: boolean) => void
  setMicrophoneEnabled: (enabled: boolean) => void
  nextStep: () => void
  previousStep: () => void
  saveProgress: () => Promise<void>
  completeOnboarding: () => Promise<void>
}

const initialState: OnboardingV2State = {
  step: 'welcome',
  email: '',
  password: '',
  nickname: '',
  photoUrl: null,
  age: null,
  moodPreferences: [],
  intentionPreferences: [],
  topicPreferences: [],
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

  const setNickname = useCallback((nickname: string) => {
    setState(prev => ({ ...prev, nickname }))
  }, [])

  const setPhotoUrl = useCallback((photoUrl: string | null) => {
    setState(prev => ({ ...prev, photoUrl }))
  }, [])

  const setAge = useCallback((age: number | null) => {
    setState(prev => ({ ...prev, age }))
  }, [])

  const setMoodPreferences = useCallback((moodPreferences: string[]) => {
    setState(prev => ({ ...prev, moodPreferences }))
  }, [])

  const setIntentionPreferences = useCallback((intentionPreferences: string[]) => {
    setState(prev => ({ ...prev, intentionPreferences }))
  }, [])

  const setTopicPreferences = useCallback((topicPreferences: string[]) => {
    setState(prev => ({ ...prev, topicPreferences }))
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

  const saveProgress = useCallback(async () => {
    // Save onboarding progress to backend (non-blocking)
    // This will be implemented when we create the API route
    try {
      // TODO: Implement API call to save progress
      console.log('[OnboardingV2] Saving progress:', state)
    } catch (error) {
      console.error('[OnboardingV2] Error saving progress:', error)
    }
  }, [state])

  const completeOnboarding = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Save all onboarding data
      const response = await fetch('/api/onboarding-v2/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: state.email,
          nickname: state.nickname,
          photoUrl: state.photoUrl,
          age: state.age,
          moodPreferences: state.moodPreferences,
          intentionPreferences: state.intentionPreferences,
          topicPreferences: state.topicPreferences,
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
        setState(prev => ({ ...prev, step: 'youre-in', loading: false }))
      } else {
        throw new Error(data.error || 'Failed to complete onboarding')
      }
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Failed to complete onboarding' 
      }))
    }
  }, [state])

  return (
    <OnboardingV2Context.Provider
      value={{
        state,
        setStep,
        setEmail,
        setPassword,
        setNickname,
        setPhotoUrl,
        setAge,
        setMoodPreferences,
        setIntentionPreferences,
        setTopicPreferences,
        setNotificationsEnabled,
        setCameraEnabled,
        setMicrophoneEnabled,
        nextStep,
        previousStep,
        saveProgress,
        completeOnboarding,
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

