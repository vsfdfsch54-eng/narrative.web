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
  normalizeOnboardingStep,
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
  dbStepLoaded: boolean // True when we've loaded onboarding_step from DB
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
    dbStepLoaded: false,
  })
  
  const initializationRef = useRef(false)

  const renderShell = (content: ReactNode) => (
    <AppShell title="Onboarding" showDock={false}>
      {content}
    </AppShell>
  )

  // PHASE 1: Initialize - Load user from database and set step
  // This is the ONLY place we read onboarding_step from DB
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return
    
    // If no user, allow email step to show (for new signups)
    if (!user) {
      setState(prev => ({
        ...prev,
        step: 'email',
        dbStepLoaded: true,
        loading: false,
      }))
      return
    }

    // Prevent multiple initializations
    if (initializationRef.current) return
    initializationRef.current = true

    const initializeFromDB = async () => {
      setState(prev => ({ ...prev, loading: true }))
      
      try {
        // Fetch user from database - SINGLE SOURCE OF TRUTH
        const response = await fetch(`/api/users?userId=${user.id}`)
        const data = await response.json()
        
        if (!data.success || !data.data) {
          // User doesn't exist in DB - create with 'email' step
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
              dbStepLoaded: true 
            }))
            return
          }

          // New user - start at email step
          setState(prev => ({
            ...prev,
            step: 'email',
            email: user.email || '',
            loading: false,
            dbStepLoaded: true,
          }))
          return
        }

        const dbUser = data.data
        
        // Read onboarding_step from database - SINGLE SOURCE OF TRUTH
        const dbStep = normalizeOnboardingStep(dbUser.onboarding_step)
        
        // If complete, redirect immediately
        if (dbStep === 'complete') {
          router.push(getOnboardingRouteForStep('complete'))
          return
        }

        // Set step from database
        setState(prev => ({
          ...prev,
          step: dbStep,
          email: dbUser.email || user.email || '',
          name: dbUser.name || '',
          interests: dbUser.interests || [],
          loading: false,
          dbStepLoaded: true,
        }))
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Failed to initialize. Please refresh.',
          dbStepLoaded: true 
        }))
      }
    }

    initializeFromDB()
  }, [user, authLoading, router])

  // Helper to update onboarding step in database
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

  // Email step handler
  const handleEmailSubmit = useCallback(async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Generate a temporary secure password for signup
      // Supabase requires a password, but user will set their own in the password step
      // We generate a secure random password that they'll never need to know
      const tempPassword = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '')
      
      // Sign up user with email and temporary password
      const result = await signUp(email, tempPassword)
      
      if (result.error) {
        // Check if it's a password validation error and provide better message
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
        // User created - update DB step to 'name' BEFORE advancing
        const updated = await updateOnboardingStepInDB('name')
        
        if (updated) {
          setState(prev => ({
            ...prev,
            email,
            step: 'name',
            loading: false,
          }))
        } else {
          setState(prev => ({ ...prev, loading: false, error: 'Failed to save progress. Please try again.' }))
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

      // Only advance after DB confirms update
      setState(prev => ({
        ...prev,
        name,
        step: 'password',
        loading: false,
      }))
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: 'Failed to save name. Please try again.' }))
    }
  }, [user])

  // Password step handler
  const handlePasswordSubmit = useCallback(async (password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Update password in Supabase Auth if provided
      if (password && user) {
        try {
          await supabase.auth.updateUser({ password })
        } catch (error) {
          // Continue anyway - password update is optional
        }
      }

      // Update step to 'interests' in database
      const updated = await updateOnboardingStepInDB('interests')
      
      if (updated) {
        setState(prev => ({
          ...prev,
          password,
          step: 'interests',
          loading: false,
        }))
      } else {
        setState(prev => ({ ...prev, loading: false, error: 'Failed to save progress. Please try again.' }))
      }
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: 'Failed to save progress. Please try again.' }))
    }
  }, [user, updateOnboardingStepInDB])

  // Interests step handler
  const handleInterestsSubmit = useCallback(async (interests: string[]) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
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

      // Only advance after DB confirms update
      setState(prev => ({
        ...prev,
        interests,
        step: 'personality',
        loading: false,
      }))
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: 'Failed to save interests. Please try again.' }))
    }
  }, [user])

  // Personality step handler
  const handlePersonalitySubmit = useCallback(async (answers: Record<string, string | string[]>) => {
    setState(prev => ({ ...prev, loading: true, error: null, personalityAnswers: answers }))
    
    try {
      // Try to generate personality (optional - won't block)
      if (user?.id) {
        try {
          await fetch('/api/personality/generate', {
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
        } catch (error) {
          // Continue anyway - personality is optional
        }
      }

      // Update step to 'complete' in database
      const updated = await updateOnboardingStepInDB('complete')
      
      if (updated) {
        // Redirect to vibe
        router.push(getNextOnboardingRoute('complete'))
      } else {
        setState(prev => ({ ...prev, loading: false, error: 'Failed to complete. Please try again.' }))
      }
    } catch (error) {
      // Try to update anyway
      await updateOnboardingStepInDB('complete')
      router.push(getNextOnboardingRoute('complete'))
    }
  }, [user, state.interests, router, updateOnboardingStepInDB])

  // Skip personality handler
  const handleSkipPersonality = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }))
    
    try {
      // Update step to 'complete' in database
      const updated = await updateOnboardingStepInDB('complete')
      
      if (updated) {
        router.push(getNextOnboardingRoute('complete'))
      } else {
        setState(prev => ({ ...prev, loading: false, error: 'Failed to complete. Please try again.' }))
      }
    } catch (error) {
      // Try to update anyway
      await updateOnboardingStepInDB('complete')
      router.push(getNextOnboardingRoute('complete'))
    }
  }, [router, updateOnboardingStepInDB])

  // Go back handler
  const goBack = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(state.step)
    if (currentIndex > 0) {
      const prevStep = STEP_ORDER[currentIndex - 1]
      setState(prev => ({ ...prev, step: prevStep, error: null }))
    }
  }, [state.step])

  // Show loading while initializing from DB
  if (authLoading || (!state.dbStepLoaded && user)) {
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
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
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
