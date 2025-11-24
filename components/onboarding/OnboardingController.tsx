"use client"

import { useState, useEffect, useCallback, useRef, ReactNode } from "react"
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
import { AppShell } from "@/components/AppShell"
import { 
  OnboardingStep, 
  getNextOnboardingRoute, 
  getOnboardingRouteForStep,
  getNextStep,
  isValidOnboardingStep,
  getInitialStep,
  STEP_ORDER
} from "@/lib/onboarding"

interface OnboardingState {
  step: OnboardingStep
  email: string
  name: string
  password: string
  interests: string[]
  personalityAnswers: Record<string, string | string[]>
  loading: boolean
  error: string | null
  userLoaded: boolean
}

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
    userLoaded: false,
  })
  
  const isInitializing = useRef(true)

  const renderShell = (content: ReactNode) => (
    <AppShell title="Onboarding" showDock={false}>
      {content}
    </AppShell>
  )

  // Initialize: Load user from database and set step
  useEffect(() => {
    if (authLoading || !user || !isInitializing.current) return

    const initializeUser = async () => {
      isInitializing.current = false
      setState(prev => ({ ...prev, loading: true }))
      
      try {
        // Fetch user from database - this is the single source of truth
        const response = await fetch(`/api/users?userId=${user.id}`)
        const data = await response.json()
        
        if (!data.success || !data.data) {
          // User doesn't exist - create with initial step
          const createResponse = await fetch('/api/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              email: user.email || '',
              name: '',
              interests: [],
              onboarding_step: 'email',
            }),
          })

          const createData = await createResponse.json()
          if (!createData.success && createData.error?.code !== '23505') {
            setState(prev => ({ 
              ...prev, 
              loading: false, 
              error: 'Failed to initialize. Please refresh.',
              userLoaded: true 
            }))
            return
          }

          // Set initial step
          const initialStep = getInitialStep()
          setState(prev => ({
            ...prev,
            step: initialStep,
            email: user.email || '',
            loading: false,
            userLoaded: true,
          }))
          return
        }

        const existingUser = data.data
        
        // Read onboarding_step from database - single source of truth
        const dbStep = existingUser.onboarding_step || 'start'
        const currentStep: OnboardingStep = isValidOnboardingStep(dbStep) 
          ? dbStep 
          : getInitialStep()

        // If complete, redirect to vibe
        if (currentStep === 'complete') {
          router.push(getOnboardingRouteForStep('complete'))
          return
        }

        // Pre-fill state with existing data
        setState(prev => ({
          ...prev,
          email: existingUser.email || user.email || '',
          name: existingUser.name || '',
          interests: existingUser.interests || [],
          step: currentStep === 'start' ? getInitialStep() : currentStep,
          loading: false,
          userLoaded: true,
        }))
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Failed to initialize. Please refresh.',
          userLoaded: true 
        }))
      }
    }

    initializeUser()
  }, [user, authLoading, router])

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

  // Helper to update onboarding step in database
  const updateOnboardingStep = useCallback(async (step: OnboardingStep) => {
    if (!user?.id) return false

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          onboarding_step: step,
        }),
      })

      const data = await response.json()
      if (!data.success) {
        return false
      }
      return true
    } catch (error) {
      return false
    }
  }, [user])

  const handleEmailSubmit = useCallback(async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Sign up user with email
      const result = await signUp(email, '') // Password will be set later
      
      if (result.error) {
        setState(prev => ({ ...prev, loading: false, error: result.error || 'Failed to sign up' }))
        return
      }

      // Update step to 'name' in database
      await updateOnboardingStep('name')

      updateField('email', email)
      goNext()
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message || 'Failed to sign up' }))
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [signUp, updateField, goNext, updateOnboardingStep])

  const handleNameSubmit = useCallback(async (name: string) => {
    setState(prev => ({ ...prev, loading: true }))
    
    try {
      // Save name and update step to 'password' in database
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          name,
          onboarding_step: 'password',
        }),
      })

      const data = await response.json()
      if (!data.success) {
        setState(prev => ({ ...prev, loading: false, error: 'Failed to save name. Please try again.' }))
        return
      }

      updateField('name', name)
      goNext()
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: 'Failed to save name. Please try again.' }))
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
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
            // Continue anyway - password update is optional
          }
        } catch (error) {
          // Continue anyway
        }
      }

      // Update step to 'interests' in database
      await updateOnboardingStep('interests')
      
      updateField('password', password)
      goNext()
    } catch (error) {
      // Continue anyway
      updateField('password', password)
      goNext()
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [user, updateField, goNext, updateOnboardingStep])

  const handleInterestsSubmit = useCallback(async (interests: string[]) => {
    setState(prev => ({ ...prev, loading: true }))
    
    try {
      // Save interests and update step to 'personality' in database
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          interests,
          onboarding_step: 'personality',
        }),
      })

      const data = await response.json()
      if (!data.success) {
        setState(prev => ({ ...prev, loading: false, error: 'Failed to save interests. Please try again.' }))
        return
      }

      updateField('interests', interests)
      goNext()
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: 'Failed to save interests. Please try again.' }))
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
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
          // Continue anyway - personality is optional
        }
      }

      // Update step to 'complete' in database
      await updateOnboardingStep('complete')

      // Redirect to vibe
      router.push(getNextOnboardingRoute('complete'))
    } catch (error) {
      // Update step to 'complete' anyway
      await updateOnboardingStep('complete')
      router.push(getNextOnboardingRoute('complete'))
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [user, state.interests, updateField, router, updateOnboardingStep])

  const handleSkipPersonality = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }))
    
    try {
      // Update step to 'complete' in database
      await updateOnboardingStep('complete')
      
      // Redirect to vibe
      router.push(getNextOnboardingRoute('complete'))
    } catch (error) {
      // Redirect anyway
      router.push(getNextOnboardingRoute('complete'))
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [router, updateOnboardingStep])

  // Show loading until user is loaded from database
  if (authLoading || !user || !state.userLoaded) {
    return renderShell(
      <div
        style={{
          minHeight: '50vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: tokens.colors.textSecondary }}>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return renderShell(
      <div
        style={{
          minHeight: '50vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <p style={{ color: tokens.colors.textPrimaryOnDark, ...tokens.typography.heading }}>
          Please sign in to continue
        </p>
      </div>
    )
  }

  const currentStepIndex = STEP_ORDER.indexOf(state.step)
  const canGoBack = currentStepIndex > 0
  const isLastStep = currentStepIndex === STEP_ORDER.length - 1

  return renderShell(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacing[20],
      }}
    >
      {!isLastStep && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: tokens.spacing[8],
          }}
        >
          {STEP_ORDER.slice(0, -1).map((step, index) => (
            <span
              key={step}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background:
                  index <= currentStepIndex
                    ? tokens.colors.surface1
                    : tokens.colors.backgroundSecondary,
                opacity: index <= currentStepIndex ? 1 : 0.3,
              }}
            />
          ))}
        </div>
      )}

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
            textAlign: 'center',
            pointerEvents: 'auto',
          }}
        >
          {state.error}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={state.step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={{ pointerEvents: 'none', width: '100%' }}
        >
          <div style={{ pointerEvents: 'auto', width: '100%' }}>
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
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '240px',
                  textAlign: 'center',
                }}
              >
                <p style={{ color: tokens.colors.textPrimaryOnDark, ...tokens.typography.heading }}>
                  Setting up your profile...
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
