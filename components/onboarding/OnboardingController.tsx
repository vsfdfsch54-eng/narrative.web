"use client"

import { useState, useEffect, useCallback, useRef, ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  normalizeOnboardingStep,
  isValidOnboardingStep,
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
  dbStepLoaded: boolean
}

export function OnboardingController() {
  const router = useRouter()
  const searchParams = useSearchParams()
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
    dbStepLoaded: false,
  })
  
  const hasInitializedRef = useRef(false)

  const renderShell = (content: ReactNode) => (
    <AppShell title="Onboarding" showDock={false}>
      {content}
    </AppShell>
  )

  // Initialize - only run once when user becomes available
  useEffect(() => {
    // Wait for auth to finish
    if (authLoading) return
    
    // If no user, show email step immediately (no DB call needed)
    if (!user) {
      if (!hasInitializedRef.current) {
        setState(prev => ({
          ...prev,
          step: 'email',
          dbStepLoaded: true,
          loading: false,
        }))
        hasInitializedRef.current = true
      }
      return
    }

    // Prevent multiple initializations
    if (hasInitializedRef.current) return
    hasInitializedRef.current = true

    const initializeFromDB = async () => {
      try {
        // Check URL query parameter first (for deep-linking)
        const urlStep = searchParams.get('step')
        let initialStep: OnboardingStep | null = null
        if (urlStep && isValidOnboardingStep(urlStep)) {
          initialStep = urlStep
        }
        
        // Fetch user from database
        const response = await fetch(`/api/users?userId=${user.id}`)
        const data = await response.json()
        
        if (!data.success || !data.data) {
          // User doesn't exist - use URL step or default to email
          const stepToUse = initialStep || 'email'
          setState(prev => ({
            ...prev,
            step: stepToUse,
            email: user.email || '',
            dbStepLoaded: true,
            loading: false,
          }))
          return
        }

        const dbUser = data.data
        const dbStep = normalizeOnboardingStep(dbUser.onboarding_step)
        
        // If complete, redirect immediately
        if (dbStep === 'complete') {
          router.push(getOnboardingRouteForStep('complete'))
          return
        }

        // Use URL step if provided and valid, otherwise use DB step
        const stepToUse = initialStep && isValidOnboardingStep(initialStep) ? initialStep : dbStep

        // Set step from database or URL
        setState(prev => ({
          ...prev,
          step: stepToUse,
          email: dbUser.email || user.email || '',
          name: dbUser.name || '',
          interests: dbUser.interests || [],
          dbStepLoaded: true,
          loading: false,
        }))
      } catch (error) {
        // On error, use URL step or default to email
        const urlStep = searchParams.get('step')
        const stepToUse = urlStep && isValidOnboardingStep(urlStep) ? urlStep : 'email'
        setState(prev => ({
          ...prev,
          step: stepToUse,
          email: user.email || '',
          dbStepLoaded: true,
          loading: false,
        }))
      }
    }

    initializeFromDB()
  }, [user, authLoading]) // Removed router from dependencies

  // Helper to update onboarding step in database (non-blocking)
  const updateOnboardingStepInDB = useCallback(async (step: OnboardingStep): Promise<boolean> => {
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
      return data.success === true
    } catch (error) {
      return false
    }
  }, [user])

  // Email step handler - wait for DB confirmation
  const handleEmailSubmit = useCallback(async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Generate temporary password
      const tempPassword = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '')
      
      // Sign up user
      const result = await signUp(email, tempPassword)
      
      if (result.error) {
        if (result.error.includes('password') || result.error.includes('Password') || result.error.includes('invalid')) {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'An account with this email may already exist. Please sign in instead.' 
          }))
        } else {
          setState(prev => ({ ...prev, loading: false, error: result.error || 'Failed to sign up' }))
        }
        return
      }

      const signupUserId = result.data?.user?.id
      
      if (signupUserId) {
        // Update DB step to 'name' BEFORE advancing
        const updated = await updateOnboardingStepInDB('name')
        
        if (updated) {
        // Only advance after DB confirms update
        setState(prev => ({
          ...prev,
          email,
          step: 'name',
          loading: false,
        }))
        
        // Update URL to reflect current step
        router.replace(`/onboarding?step=name`)
        } else {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'Failed to save progress. Please try again.' 
          }))
        }
      } else {
        // Email confirmation required
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Please check your email to verify your account, then return here to continue.' 
        }))
      }
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message || 'Failed to sign up' }))
    }
  }, [signUp, updateOnboardingStepInDB])

  // Name step handler
  const handleNameSubmit = useCallback(async (name: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Save name and update step
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

      // Advance immediately after DB confirms
      setState(prev => ({
        ...prev,
        name,
        step: 'password',
        loading: false,
      }))
      
      // Update URL to reflect current step
      router.replace(`/onboarding?step=password`)
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: 'Failed to save name. Please try again.' }))
    }
  }, [user])

  // Password step handler
  const handlePasswordSubmit = useCallback(async (password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Update password in background (non-blocking)
      if (password && user) {
        supabase.auth.updateUser({ password }).catch(() => {
          // Continue anyway
        })
      }

      // Update step in DB
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          onboarding_step: 'interests',
        }),
      })

      const data = await response.json()
      if (data.success) {
        // Advance immediately after DB confirms
        setState(prev => ({
          ...prev,
          password,
          step: 'interests',
          loading: false,
        }))
        
        // Update URL to reflect current step
        router.replace(`/onboarding?step=interests`)
      } else {
        setState(prev => ({ ...prev, loading: false, error: 'Failed to save progress. Please try again.' }))
      }
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: 'Failed to save progress. Please try again.' }))
    }
  }, [user])

  // Interests step handler
  const handleInterestsSubmit = useCallback(async (interests: string[]) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Save interests and update step
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

      // Advance immediately after DB confirms
      setState(prev => ({
        ...prev,
        interests,
        step: 'personality',
        loading: false,
      }))
      
      // Update URL to reflect current step
      router.replace(`/onboarding?step=personality`)
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: 'Failed to save interests. Please try again.' }))
    }
  }, [user])

  // Personality step handler
  const handlePersonalitySubmit = useCallback(async (answers: Record<string, string | string[]>) => {
    setState(prev => ({ ...prev, loading: true, error: null, personalityAnswers: answers }))
    
    try {
      // Update step to complete first (most important)
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          onboarding_step: 'complete',
        }),
      })

      const data = await response.json()
      
      // Redirect immediately if step update succeeds
      if (data.success) {
        router.push(getNextOnboardingRoute('complete'))
        return
      }

      // Try personality generation in background (non-blocking)
      if (user?.id) {
        fetch('/api/personality/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            questionnaireAnswers: answers,
            interests: state.interests,
            vibe: null,
            topic: null,
          }),
        }).catch(() => {
          // Continue anyway
        })
      }

      // Redirect even if personality generation fails
      router.push(getNextOnboardingRoute('complete'))
    } catch (error) {
      // Try to update step anyway
      updateOnboardingStepInDB('complete').catch(() => {})
      router.push(getNextOnboardingRoute('complete'))
    }
  }, [user, state.interests, router, updateOnboardingStepInDB])

  // Skip personality handler
  const handleSkipPersonality = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }))
    
    try {
      // Update step to complete
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          onboarding_step: 'complete',
        }),
      })

      const data = await response.json()
      
      // Redirect immediately
      if (data.success) {
        router.push(getNextOnboardingRoute('complete'))
      } else {
        // Try anyway
        updateOnboardingStepInDB('complete').catch(() => {})
        router.push(getNextOnboardingRoute('complete'))
      }
    } catch (error) {
      // Redirect anyway
      updateOnboardingStepInDB('complete').catch(() => {})
      router.push(getNextOnboardingRoute('complete'))
    }
  }, [user, router, updateOnboardingStepInDB])

  // Go back handler - update DB when going back
  const goBack = useCallback(async () => {
    const currentIndex = STEP_ORDER.indexOf(state.step)
    if (currentIndex > 0) {
      const prevStep = STEP_ORDER[currentIndex - 1]
      
      // Update DB to previous step
      if (user?.id) {
        try {
          await updateOnboardingStepInDB(prevStep)
        } catch (error) {
          // Continue anyway - UI update is more important
        }
      }
      
      setState(prev => ({ ...prev, step: prevStep, error: null }))
      
      // Update URL to reflect current step
      router.replace(`/onboarding?step=${prevStep}`)
    }
  }, [state.step, user, updateOnboardingStepInDB])

  // Show loading only if auth is loading and we haven't initialized
  if (authLoading && !hasInitializedRef.current) {
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

  // For steps other than email, require user
  if (!user && state.step !== 'email') {
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

  return renderShell(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacing[20],
      }}
    >
      {/* Progress indicators */}
      {state.step !== 'complete' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: tokens.spacing[8],
          }}
        >
          {STEP_ORDER.map((step, index) => (
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

      {/* Error message */}
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

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state.step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ pointerEvents: 'none', width: '100%' }}
        >
          <div style={{ pointerEvents: 'auto', width: '100%' }}>
            {state.step === 'email' && (
              <EmailStep
                email={state.email}
                onEmailChange={(email) => setState(prev => ({ ...prev, email }))}
                onSubmit={handleEmailSubmit}
                loading={state.loading}
                error={state.error}
                onBack={() => router.push('/')}
              />
            )}

            {state.step === 'name' && (
              <NameStep
                name={state.name}
                onNameChange={(name) => setState(prev => ({ ...prev, name }))}
                onSubmit={handleNameSubmit}
                loading={state.loading}
                error={state.error}
                onBack={canGoBack ? goBack : undefined}
              />
            )}

            {state.step === 'password' && (
              <PasswordStep
                password={state.password}
                onPasswordChange={(password) => setState(prev => ({ ...prev, password }))}
                onSubmit={handlePasswordSubmit}
                loading={state.loading}
                error={state.error}
                onBack={canGoBack ? goBack : undefined}
              />
            )}

            {state.step === 'interests' && (
              <InterestsStep
                selectedInterests={state.interests}
                onInterestsChange={(interests) => setState(prev => ({ ...prev, interests }))}
                onSubmit={handleInterestsSubmit}
                loading={state.loading}
                error={state.error}
                onBack={canGoBack ? goBack : undefined}
              />
            )}

            {state.step === 'personality' && (
              <PersonalityStep
                answers={state.personalityAnswers}
                onAnswersChange={(answers) => setState(prev => ({ ...prev, personalityAnswers: answers }))}
                onSubmit={handlePersonalitySubmit}
                onSkip={handleSkipPersonality}
                loading={state.loading}
                error={state.error}
                onBack={canGoBack ? goBack : undefined}
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
