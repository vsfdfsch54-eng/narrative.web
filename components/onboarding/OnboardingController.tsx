"use client"

import { useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/hooks/use-auth"
import { useOnboarding } from "@/context/OnboardingContext"
import { tokens } from "@/lib/design-tokens"
import { EmailStep } from "./steps/EmailStep"
import { NameStep } from "./steps/NameStep"
import { VibeStep } from "./steps/VibeStep"
import { TopicStep } from "./steps/TopicStep"
import { TimeframeStep } from "./steps/TimeframeStep"
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
    setName,
    setVibe,
    setTopic,
    setTimeframe,
    saveProgress,
    initialize,
  } = useOnboarding()

  const hasInitializedRef = useRef(false)
  const hasRedirectedRef = useRef(false)

  // Redirect if onboarding is complete - ALWAYS redirect to /chat
  useEffect(() => {
    if (authLoading || !user || !state.initialized) return
    if (hasRedirectedRef.current) return

    // Check if user is already completed
    if (state.step === 'complete') {
      hasRedirectedRef.current = true
      router.replace('/chat')
      // Fallback navigation
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname !== '/chat') {
          window.location.href = '/chat'
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
            router.replace('/chat')
            // Fallback navigation
            setTimeout(() => {
              if (typeof window !== 'undefined' && window.location.pathname !== '/chat') {
                window.location.href = '/chat'
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

  // Email step handler - just advance to name step
  // Account creation will happen when name is submitted (if needed)
  const handleEmailSubmit = async (email: string): Promise<void> => {
    setEmail(email)
    // Navigate immediately - non-blocking
    navigateToStep('name')
  }

  // Name step handler - create account here if needed (background, non-blocking)
  const handleNameSubmit = async (name: string) => {
    setName(name)
    
    // Navigate immediately - don't wait for account creation
    navigateToStep('vibe')
    
    // Create account in background (non-blocking)
    if (!user && state.email) {
      // Run account creation in background - don't await
      signUp(state.email, Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + 'A1!')
        .then((result) => {
          if (result.error && !result.error.includes('already registered') && !result.error.includes('already exists')) {
            console.error('[OnboardingController] Signup error:', result.error)
          }
        })
        .catch((error) => {
          console.error('[OnboardingController] Account creation error:', error)
        })
    }
    
    // Save progress in background (non-blocking)
    saveProgress('vibe').catch((error) => {
      console.error('[OnboardingController] Save progress error:', error)
    })
  }

  // Vibe step handler - instant navigation, background save
  const handleVibeSubmit = async (vibe: string) => {
    setVibe(vibe)
    // Navigate immediately
    navigateToStep('topic')
    // Save in background (non-blocking)
    saveProgress('topic').catch((error) => {
      console.error('[OnboardingController] Save progress error:', error)
    })
  }

  // Topic step handler - instant navigation, background save
  const handleTopicSubmit = async (topic: string) => {
    setTopic(topic)
    // Navigate immediately
    navigateToStep('timeframe')
    // Save in background (non-blocking)
    saveProgress('timeframe').catch((error) => {
      console.error('[OnboardingController] Save progress error:', error)
    })
  }

  // Timeframe step handler - instant navigation, background save
  const handleTimeframeSubmit = async (timeframe: number | null) => {
    setTimeframe(timeframe)
    // Navigate immediately
    navigateToStep('confirmation')
    // Save in background (non-blocking)
    saveProgress('confirmation').catch((error) => {
      console.error('[OnboardingController] Save progress error:', error)
    })
  }

  // Confirmation step handler - complete onboarding
  const handleConfirmationSubmit = async () => {
    // Save completion in background
    saveProgress('complete').catch((error) => {
      console.error('[OnboardingController] Save progress error:', error)
    })
    
    // Navigate to chat immediately
    router.replace('/chat')
    // Fallback navigation
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.location.pathname !== '/chat') {
        window.location.href = '/chat'
      }
    }, 100)
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

  // For steps other than email, require user
  if (!user && state.step !== 'email') {
    return (
      <AppShell title="Onboarding" showDock={false}>
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
      </AppShell>
    )
  }

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

              {state.step === 'name' && (
                <NameStep
                  name={state.name}
                  onNameChange={setName}
                  onSubmit={handleNameSubmit}
                  loading={false}
                  error={null}
                  onBack={canGoBack ? goBack : undefined}
                />
              )}

              {state.step === 'vibe' && (
                <VibeStep
                  selectedVibe={state.vibe}
                  onVibeChange={setVibe}
                  onSubmit={handleVibeSubmit}
                  loading={false}
                  error={null}
                  onBack={canGoBack ? goBack : undefined}
                />
              )}

              {state.step === 'topic' && (
                <TopicStep
                  selectedTopic={state.topic}
                  onTopicChange={setTopic}
                  onSubmit={handleTopicSubmit}
                  loading={false}
                  error={null}
                  onBack={canGoBack ? goBack : undefined}
                />
              )}

              {state.step === 'timeframe' && (
                <TimeframeStep
                  selectedTimeframe={state.timeframe}
                  onTimeframeChange={setTimeframe}
                  onSubmit={handleTimeframeSubmit}
                  loading={false}
                  error={null}
                  onBack={canGoBack ? goBack : undefined}
                />
              )}

              {state.step === 'confirmation' && (
                <ConfirmationStep
                  name={state.name}
                  vibe={state.vibe}
                  topic={state.topic}
                  timeframe={state.timeframe}
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
