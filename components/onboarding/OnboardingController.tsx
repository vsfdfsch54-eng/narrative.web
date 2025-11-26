"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/hooks/use-auth"
import { useOnboarding } from "@/context/OnboardingContext"
import { tokens } from "@/lib/design-tokens"
import { EmailStep } from "./steps/EmailStep"
import { PasswordStep } from "./steps/PasswordStep"
import { NameStep } from "./steps/NameStep"
import { QuestionsStep } from "./steps/QuestionsStep"
import { InterestsStep } from "./steps/InterestsStep"
import { ConfirmationStep } from "./steps/ConfirmationStep"
import { AppShell } from "@/components/AppShell"
import { 
  OnboardingStep, 
  getNextOnboardingRoute, 
  getOnboardingRouteForStep,
  normalizeOnboardingStep,
  isValidOnboardingStep,
  STEP_ORDER
} from "@/lib/onboarding"

export function OnboardingController() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, signUp, loading: authLoading } = useAuth()
  const {
    state,
    setStep,
    setEmail,
    setPassword,
    setFirstName,
    setLastName,
    setQuestionAnswer,
    setQuestionsAnswers,
    setInterests,
    saveProgress,
    initialize,
  } = useOnboarding()
  
  const hasInitializedRef = useRef(false)
  const hasRedirectedRef = useRef(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Redirect if onboarding is complete - ALWAYS redirect to /vibe
  useEffect(() => {
    if (authLoading || !user || !state.initialized) return
    if (hasRedirectedRef.current) return
    
    // Check if user is already completed
    if (state.step === 'complete') {
      hasRedirectedRef.current = true
      router.replace('/vibe')
      // Fallback navigation
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname !== '/vibe') {
          window.location.href = '/vibe'
        }
      }, 100)
      return
    }

    // Check database for completion status
    const checkCompletion = async () => {
      try {
        const response = await fetch(`/api/users?userId=${user.id}`)
        const data = await response.json()
        
        if (data.success && data.data) {
          const dbStep = normalizeOnboardingStep(data.data.onboarding_step)
          if (dbStep === 'complete' || data.data.onboarding_completed) {
            hasRedirectedRef.current = true
            router.replace('/vibe')
            // Fallback navigation
            setTimeout(() => {
              if (typeof window !== 'undefined' && window.location.pathname !== '/vibe') {
                window.location.href = '/vibe'
              }
            }, 100)
          }
        }
      } catch (error) {
        console.error('[OnboardingController] Error checking completion:', error)
      }
    }

    checkCompletion()
  }, [user, authLoading, state.initialized, state.step, router])

  // Initialize from URL or database
  useEffect(() => {
    if (authLoading || !state.initialized) return
    if (hasInitializedRef.current) return

    // Check URL parameter first
    const urlStep = searchParams.get('step')
    if (urlStep && isValidOnboardingStep(urlStep)) {
      const normalizedStep = normalizeOnboardingStep(urlStep)
      if (normalizedStep !== state.step) {
        setStep(normalizedStep)
      }
    }

    hasInitializedRef.current = true
  }, [authLoading, state.initialized, state.step, searchParams, setStep])

  // Helper function for reliable navigation with fallback
  const navigateToStep = (step: OnboardingStep) => {
    const route = `/onboarding?step=${step}`
    // Update step in context FIRST (synchronous)
    setStep(step)
    // Then navigate - router.replace() is non-blocking
    router.replace(route)
    // Fallback: if router doesn't navigate within 100ms, use window.location
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.location.pathname === '/onboarding') {
        const params = new URLSearchParams(window.location.search)
        if (params.get('step') !== step) {
          window.location.href = route
        }
      }
    }, 100)
      }

  // Email step handler - advance to password step
  const handleEmailSubmit = async (email: string): Promise<void> => {
    setEmail(email)
    // Navigate immediately - non-blocking
    navigateToStep('password')
    }

  // Password step handler - create account here
  const handlePasswordSubmit = async (password: string): Promise<void> => {
    setPasswordError(null) // Clear previous errors
    setPassword(password)
    
    // Create account immediately (this is where account creation happens)
    if (!user && state.email) {
      try {
        const result = await signUp(state.email, password)
        
        if (!result.success || result.error) {
          // Signup failed - show error to user
          const errorMessage = result.error || 'Failed to create account. Please try again.'
          setPasswordError(errorMessage)
          console.error('[OnboardingController] Signup error:', errorMessage)
          return // Don't navigate if signup failed
        }
        
        // Wait briefly for auth to propagate
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error: any) {
        // Signup failed - show error to user
        const errorMessage = error?.message || 'Failed to create account. Please try again.'
        setPasswordError(errorMessage)
        console.error('[OnboardingController] Account creation error:', error)
        return // Don't navigate if signup failed
      }
    }
        
    // Navigate to name step only if signup succeeded or user already exists
    navigateToStep('name')
    
    // Save progress in background (non-blocking)
    saveProgress('name').catch((error) => {
      console.error('[OnboardingController] Save progress error:', error)
    })
  }

  // Name step handler - instant navigation, background save
  const handleNameSubmit = async (firstName: string, lastName: string) => {
    setFirstName(firstName)
    setLastName(lastName)
    // Navigate immediately
    navigateToStep('questions')
    // Save in background (non-blocking)
    saveProgress('questions').catch((error) => {
      console.error('[OnboardingController] Save progress error:', error)
    })
  }

  // Questions step handler - instant navigation, background save
  const handleQuestionsSubmit = async (answers: Record<string, string>) => {
    setQuestionsAnswers(answers)
    // Navigate immediately
    navigateToStep('interests')
    // Save in background (non-blocking)
    saveProgress('interests').catch((error) => {
      console.error('[OnboardingController] Save progress error:', error)
    })
  }

  // Interests step handler - instant navigation, background save
  const handleInterestsSubmit = async (interests: string[]) => {
    setInterests(interests)
    // Navigate immediately
    navigateToStep('confirmation')
    // Save in background (non-blocking)
    saveProgress('confirmation').catch((error) => {
      console.error('[OnboardingController] Save progress error:', error)
      })
  }

  // Confirmation step handler - complete onboarding
  const handleConfirmationSubmit = async () => {
    // Mark that we're completing onboarding to prevent redirect loops
    hasRedirectedRef.current = true
    
    // Update step in context immediately (synchronous)
    setStep('complete')
    
    // Save completion - WAIT for it to complete before navigating
    // This is critical: we must ensure the database is updated before redirecting
    try {
      if (!user?.id) {
        console.error('[OnboardingController] Cannot complete: user ID missing')
        // Still try to navigate - might work if user becomes available
        router.replace('/vibe')
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.location.pathname !== '/vibe') {
            window.location.href = '/vibe'
          }
        }, 100)
        return
      }
      
      // Save synchronously for completion step - MUST wait for this
      console.log('[OnboardingController] Saving completion to database...', {
        userId: user.id,
        step: 'complete',
        completed: true
      })
      
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          firstName: state.firstName || undefined,
          lastName: state.lastName || undefined,
          questionsAnswers: Object.keys(state.questionsAnswers).length > 0 ? state.questionsAnswers : undefined,
          interests: state.interests.length > 0 ? state.interests : undefined,
          onboarding_step: 'complete',
          onboarding_completed: true,
          email: state.email || undefined,
        }),
      })
      
      const data = await response.json()
      
      if (!data.success) {
        console.error('[OnboardingController] ❌ Save completion FAILED:', data.error)
        // Don't navigate if save failed - show error instead
        // But for now, still navigate to avoid blocking user
        console.warn('[OnboardingController] Navigating anyway despite save failure')
      } else {
        console.log('[OnboardingController] ✅ Completion saved successfully')
      }
      
      // Wait longer to ensure database write is committed and propagated
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Verify the save worked by checking the database
      try {
        const verifyResponse = await fetch(`/api/users?userId=${user.id}`)
        const verifyData = await verifyResponse.json()
        
        if (verifyData.success && verifyData.data) {
          const dbStep = normalizeOnboardingStep(verifyData.data.onboarding_step)
          const dbCompleted = dbStep === 'complete' || verifyData.data.onboarding_completed === true
          
          if (!dbCompleted) {
            console.warn('[OnboardingController] ⚠️ Save verification failed - step is:', dbStep)
            // Still navigate - might be a timing issue
          } else {
            console.log('[OnboardingController] ✅ Save verified - onboarding is complete')
          }
        }
      } catch (verifyError) {
        console.error('[OnboardingController] Error verifying save:', verifyError)
      }
    } catch (error) {
      console.error('[OnboardingController] ❌ Save completion error:', error)
      // Continue anyway - navigation should still work
    }
    
    // Navigate to vibe after save completes and is verified
    // Use window.location.href for hard navigation to prevent redirect loops
    console.log('[OnboardingController] Navigating to /vibe...')
    
    // Use hard navigation to ensure clean state
    if (typeof window !== 'undefined') {
      window.location.href = '/vibe'
    } else {
      router.replace('/vibe')
    }
  }

  // Go back handler - with fallback navigation
  const goBack = async () => {
    const currentIndex = STEP_ORDER.indexOf(state.step)
    if (currentIndex > 0) {
      const prevStep = STEP_ORDER[currentIndex - 1]
      navigateToStep(prevStep)
    }
  }

  // Show loading only if auth is loading and we haven't initialized
  if (authLoading || !state.initialized) {
    return (
      <AppShell title="Onboarding" showDock={false}>
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
      </AppShell>
    )
  }

  // Don't require user for any onboarding steps
  // The saveProgress function handles missing users gracefully by allowing navigation
  // and retrying saves in the background when the user becomes available

  const currentStepIndex = STEP_ORDER.indexOf(state.step)
  const canGoBack = currentStepIndex > 0

  return (
    <AppShell title="Onboarding" showDock={false}>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacing[20],
          width: '100%',
          minHeight: 'calc(100vh - 120px)',
          padding: `${tokens.spacing[20]} ${tokens.layout.paddingHorizontal}`,
          alignItems: 'center',
          justifyContent: 'center',
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
              marginBottom: tokens.spacing[8],
          }}
        >
          {STEP_ORDER.map((step, index) => (
            <span
              key={step}
              style={{
                  width: '6px',
                  height: '6px',
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

        {/* Error message - only show critical errors */}
        {state.error && !state.error.includes('not found') && !state.error.includes('missing') && (
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
              maxWidth: '600px',
              width: '100%',
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
            style={{ pointerEvents: 'none', width: '100%', display: 'flex', justifyContent: 'center' }}
        >
            <div style={{ pointerEvents: 'auto', width: '100%', maxWidth: '600px' }}>
            {state.step === 'email' && (
              <EmailStep
                email={state.email || user?.email || ''}
                onEmailChange={setEmail}
                onSubmit={handleEmailSubmit}
                loading={false}
                error={null}
                onBack={() => router.push('/')}
              />
            )}

            {state.step === 'password' && (
              <PasswordStep
                password={state.password}
                onPasswordChange={setPassword}
                onSubmit={handlePasswordSubmit}
                loading={false}
                error={passwordError}
                onBack={canGoBack ? goBack : undefined}
              />
            )}

            {state.step === 'name' && (
              <NameStep
                firstName={state.firstName}
                lastName={state.lastName}
                onFirstNameChange={setFirstName}
                onLastNameChange={setLastName}
                onSubmit={handleNameSubmit}
                loading={false}
                error={null}
                onBack={canGoBack ? goBack : undefined}
              />
            )}

            {state.step === 'questions' && (
              <QuestionsStep
                answers={state.questionsAnswers}
                onAnswerChange={setQuestionAnswer}
                onSubmit={handleQuestionsSubmit}
                loading={false}
                error={null}
                onBack={canGoBack ? goBack : undefined}
              />
            )}

            {state.step === 'interests' && (
              <InterestsStep
                selectedInterests={state.interests}
                onInterestsChange={setInterests}
                onSubmit={handleInterestsSubmit}
                loading={false}
                error={null}
                onBack={canGoBack ? goBack : undefined}
              />
            )}

            {state.step === 'confirmation' && (
              <ConfirmationStep
                firstName={state.firstName}
                lastName={state.lastName}
                interests={state.interests}
                onSubmit={handleConfirmationSubmit}
                loading={false}
                error={null}
                onBack={canGoBack ? goBack : undefined}
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
    </AppShell>
  )
}
