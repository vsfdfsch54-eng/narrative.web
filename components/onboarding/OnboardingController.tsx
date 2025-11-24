"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabaseClient"
import { tokens } from "@/lib/design-tokens"
import { EmailStep } from "./steps/EmailStep"
import { NameStep } from "./steps/NameStep"
import { PasswordStep } from "./steps/PasswordStep"
import { InterestsStep } from "./steps/InterestsStep"
import { PersonalityStep } from "./steps/PersonalityStep"
import { Header } from "@/components/ui/header"

/**
 * Onboarding State Machine
 * 
 * Flow: email → name → password → interests → personality (optional) → complete
 */
export type OnboardingStep = 'email' | 'name' | 'password' | 'interests' | 'personality' | 'complete'

interface OnboardingState {
  step: OnboardingStep
  email: string
  name: string
  password: string
  interests: string[]
  personalityAnswers: Record<string, string | string[]>
  loading: boolean
  error: string | null
}

const STEP_ORDER: OnboardingStep[] = ['email', 'name', 'password', 'interests', 'personality', 'complete']

export function OnboardingController() {
  const router = useRouter()
  const { user, signUp, loading: authLoading } = useAuth()
  const [state, setState] = useState<OnboardingState>({
    step: 'email',
    email: '',
    name: '',
    password: '',
    interests: [],
    personalityAnswers: {},
    loading: false,
    error: null,
  })
  
  const isInitializing = useRef(true)
  const hasCreatedUser = useRef(false)

  // Initialize: Check if user exists, create if needed
  useEffect(() => {
    if (authLoading || !user || !isInitializing.current) return

    const initializeUser = async () => {
      isInitializing.current = false
      
      try {
        // Check if user exists in database via API (client-side)
        const response = await fetch(`/api/users?userId=${user.id}`)
        const data = await response.json()
        
        if (data.success && data.data) {
          const existingUser = data.data
          
          // User exists - check what's completed
          const hasName = existingUser.name && existingUser.name.trim() !== ''
          const hasInterests = existingUser.interests && Array.isArray(existingUser.interests) && existingUser.interests.length > 0
          
          if (hasName && hasInterests) {
            // Onboarding complete - redirect to vibe
            router.push('/vibe')
            return
          }

          // Pre-fill state with existing data
          setState(prev => ({
            ...prev,
            email: existingUser.email || user.email || '',
            name: existingUser.name || '',
            interests: existingUser.interests || [],
            step: !hasName ? 'name' : !hasInterests ? 'interests' : 'personality',
          }))
        } else {
          // User doesn't exist - create empty row via API
          if (!hasCreatedUser.current) {
            hasCreatedUser.current = true
            
            const createResponse = await fetch('/api/users', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                email: user.email || '',
                name: '',
                interests: [],
              }),
            })

            const createData = await createResponse.json()
            if (!createData.success && createData.error?.code !== '23505') {
              console.error('[Onboarding] Error creating user:', createData.error)
            }
          }

          // Start from name step (skip email if user is already authenticated)
          setState(prev => ({
            ...prev,
            email: user.email || '',
            step: 'name',
          }))
        }
      } catch (error) {
        console.error('[Onboarding] Initialization error:', error)
        setState(prev => ({ ...prev, error: 'Failed to initialize. Please refresh.' }))
      }
    }

    initializeUser()
  }, [user, authLoading, router])

  // Save state to localStorage for persistence
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    localStorage.setItem('onboarding_email', state.email)
    localStorage.setItem('onboarding_name', state.name)
    localStorage.setItem('onboarding_interests', JSON.stringify(state.interests))
    localStorage.setItem('onboarding_personality', JSON.stringify(state.personalityAnswers))
  }, [state.email, state.name, state.interests, state.personalityAnswers])

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const savedEmail = localStorage.getItem('onboarding_email') || ''
    const savedName = localStorage.getItem('onboarding_name') || ''
    const savedInterests = localStorage.getItem('onboarding_interests')
    const savedPersonality = localStorage.getItem('onboarding_personality')
    
    setState(prev => ({
      ...prev,
      email: savedEmail || prev.email,
      name: savedName || prev.name,
      interests: savedInterests ? JSON.parse(savedInterests) : prev.interests,
      personalityAnswers: savedPersonality ? JSON.parse(savedPersonality) : prev.personalityAnswers,
    }))
  }, [])

  const goToStep = useCallback((step: OnboardingStep) => {
    setState(prev => ({ ...prev, step, error: null }))
  }, [])

  const goNext = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(state.step)
    if (currentIndex < STEP_ORDER.length - 1) {
      goToStep(STEP_ORDER[currentIndex + 1])
    }
  }, [state.step, goToStep])

  const goBack = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(state.step)
    if (currentIndex > 0) {
      goToStep(STEP_ORDER[currentIndex - 1])
    }
  }, [state.step, goToStep])

  const updateField = useCallback(<K extends keyof OnboardingState>(
    field: K,
    value: OnboardingState[K]
  ) => {
    setState(prev => ({ ...prev, [field]: value, error: null }))
  }, [])

  const handleEmailSubmit = useCallback(async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Sign up user with email
      const result = await signUp(email, '') // Password will be set later
      
      if (result.error) {
        setState(prev => ({ ...prev, loading: false, error: result.error || 'Failed to sign up' }))
        return
      }

      updateField('email', email)
      goNext()
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message || 'Failed to sign up' }))
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [signUp, updateField, goNext])

  const handleNameSubmit = useCallback(async (name: string) => {
    updateField('name', name)
    
    // Save name to database immediately
    if (user?.id) {
      setState(prev => ({ ...prev, loading: true }))
      try {
        await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            name,
          }),
        })
      } catch (error) {
        console.error('[Onboarding] Error saving name:', error)
      } finally {
        setState(prev => ({ ...prev, loading: false }))
      }
    }
    
    goNext()
  }, [user, updateField, goNext])

  const handlePasswordSubmit = useCallback(async (password: string) => {
    setState(prev => ({ ...prev, loading: true }))
    
    try {
      // Update password in Supabase Auth if provided
      if (password && user) {
        try {
          const { error: updateError } = await supabase.auth.updateUser({
            password: password
          })
          
          if (updateError) {
            console.error('[Onboarding] Error updating password:', updateError)
            // Continue anyway - password update is optional
          }
        } catch (error) {
          console.error('[Onboarding] Password update error:', error)
          // Continue anyway
        }
      }
      
      updateField('password', password)
      goNext()
    } catch (error) {
      console.error('[Onboarding] Password update error:', error)
      // Continue anyway
      updateField('password', password)
      goNext()
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [user, updateField, goNext])

  const handleInterestsSubmit = useCallback(async (interests: string[]) => {
    updateField('interests', interests)
    
    // Save interests to database immediately
    if (user?.id) {
      setState(prev => ({ ...prev, loading: true }))
      try {
        await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            interests,
          }),
        })
      } catch (error) {
        console.error('[Onboarding] Error saving interests:', error)
      } finally {
        setState(prev => ({ ...prev, loading: false }))
      }
    }
    
    goNext()
  }, [user, updateField, goNext])

  const handlePersonalitySubmit = useCallback(async (answers: Record<string, string | string[]>) => {
    updateField('personalityAnswers', answers)
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Try to generate personality (optional - won't block if it fails)
      if (user?.id) {
        const response = await fetch('/api/personality/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            questionnaireAnswers: answers,
            interests: state.interests,
            vibe: null,
            topic: null,
          }),
        })

        const data = await response.json()
        if (!data.success) {
          console.warn('[Onboarding] Personality generation failed (optional):', data.error)
          // Continue anyway - personality is optional
        }
      }
    } catch (error) {
      console.warn('[Onboarding] Personality generation error (optional):', error)
      // Continue anyway - personality is optional
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }

    // Complete onboarding and redirect
    setState(prev => ({ ...prev, step: 'complete' }))
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('onboarding_email')
      localStorage.removeItem('onboarding_name')
      localStorage.removeItem('onboarding_interests')
      localStorage.removeItem('onboarding_personality')
    }

    // Redirect to vibe
    setTimeout(() => {
      router.push('/vibe')
    }, 500)
  }, [user, state.interests, updateField, router])

  const handleSkipPersonality = useCallback(() => {
    // Skip personality and complete onboarding
    setState(prev => ({ ...prev, step: 'complete' }))
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('onboarding_email')
      localStorage.removeItem('onboarding_name')
      localStorage.removeItem('onboarding_interests')
      localStorage.removeItem('onboarding_personality')
    }

    // Redirect to vibe
    setTimeout(() => {
      router.push('/vibe')
    }, 500)
  }, [router])

  if (authLoading || isInitializing.current) {
    return (
      <div style={{
        minHeight: '100vh',
        background: tokens.colors.backgroundApp,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ color: tokens.colors.textSecondary }}>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: tokens.colors.backgroundApp,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: tokens.spacing[20],
        padding: tokens.layout.paddingHorizontal,
      }}>
        <p style={{ color: tokens.colors.textPrimaryOnDark, ...tokens.typography.heading }}>
          Please sign in to continue
        </p>
      </div>
    )
  }

  const currentStepIndex = STEP_ORDER.indexOf(state.step)
  const canGoBack = currentStepIndex > 0
  const isLastStep = currentStepIndex === STEP_ORDER.length - 1

  return (
    <div style={{
      minHeight: '100vh',
      background: tokens.colors.backgroundApp,
      paddingBottom: '120px', // Space for floating dock
    }}>
      <Header title="Narrative" />
      
      <div style={{
        maxWidth: tokens.layout.maxWidth,
        margin: '0 auto',
        padding: `0 ${tokens.layout.paddingHorizontal}`,
        paddingTop: tokens.layout.topTitleSpacing,
      }}>
        {/* Progress Indicator */}
        {!isLastStep && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: tokens.spacing[8],
            marginBottom: tokens.spacing[28],
          }}>
            {STEP_ORDER.slice(0, -1).map((step, index) => (
              <div
                key={step}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: index <= currentStepIndex 
                    ? tokens.colors.surface1 
                    : tokens.colors.backgroundSecondary,
                  opacity: index <= currentStepIndex ? 1 : 0.3,
                }}
              />
            ))}
          </div>
        )}

        {/* Error Message */}
        {state.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: tokens.spacing[16],
              borderRadius: tokens.radii.input,
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#EF4444',
              ...tokens.typography.label,
              marginBottom: tokens.spacing[20],
              textAlign: 'center',
            }}
          >
            {state.error}
          </motion.div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={state.step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {state.step === 'email' && (
              <EmailStep
                email={state.email}
                onEmailChange={(email) => updateField('email', email)}
                onSubmit={handleEmailSubmit}
                loading={state.loading}
                error={state.error}
                onBack={() => router.push('/')}
              />
            )}

            {state.step === 'name' && (
              <NameStep
                name={state.name}
                onNameChange={(name) => updateField('name', name)}
                onSubmit={handleNameSubmit}
                loading={state.loading}
                error={state.error}
                onBack={canGoBack ? goBack : undefined}
              />
            )}

            {state.step === 'password' && (
              <PasswordStep
                password={state.password}
                onPasswordChange={(password) => updateField('password', password)}
                onSubmit={handlePasswordSubmit}
                loading={state.loading}
                error={state.error}
                onBack={canGoBack ? goBack : undefined}
              />
            )}

            {state.step === 'interests' && (
              <InterestsStep
                selectedInterests={state.interests}
                onInterestsChange={(interests) => updateField('interests', interests)}
                onSubmit={handleInterestsSubmit}
                loading={state.loading}
                error={state.error}
                onBack={canGoBack ? goBack : undefined}
              />
            )}

            {state.step === 'personality' && (
              <PersonalityStep
                answers={state.personalityAnswers}
                onAnswersChange={(answers) => updateField('personalityAnswers', answers)}
                onSubmit={handlePersonalitySubmit}
                onSkip={handleSkipPersonality}
                loading={state.loading}
                error={state.error}
                onBack={canGoBack ? goBack : undefined}
              />
            )}

            {state.step === 'complete' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                textAlign: 'center',
              }}>
                <p style={{ color: tokens.colors.textPrimaryOnDark, ...tokens.typography.heading }}>
                  Setting up your profile...
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

