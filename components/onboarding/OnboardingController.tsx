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

  // Redirect if onboarding is complete
  useEffect(() => {
    if (authLoading || !user || !state.initialized) return
    if (hasRedirectedRef.current) return

    // Check if user is already completed
    if (state.step === 'complete') {
      hasRedirectedRef.current = true
      router.replace('/chat')
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

  // Email step handler - just advance to name step
  // Account creation will happen when name is submitted (if needed)
  const handleEmailSubmit = async (email: string): Promise<void> => {
    setEmail(email)
    // Update step in context first
    setStep('name')
    // Then navigate - use both router and window.location for reliability
    router.replace(`/onboarding?step=name`)
    // Fallback: if router doesn't work, use window.location
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.location.pathname === '/onboarding') {
        const params = new URLSearchParams(window.location.search)
        if (params.get('step') !== 'name') {
          window.location.href = '/onboarding?step=name'
        }
      }
    }, 100)
  }

  // Name step handler - create account here if needed
  const handleNameSubmit = async (name: string) => {
    setName(name)
    
    // If user doesn't exist, create account now
    if (!user && state.email) {
      try {
        // Generate a secure random password
        const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + 'A1!'
        
        const result = await signUp(state.email, tempPassword)
        
        if (result.error) {
          if (result.error.includes('already registered') || result.error.includes('already exists')) {
            // User exists - they should login, but continue anyway
            console.warn('[OnboardingController] User already exists, continuing anyway')
          } else {
            // Other error - log but continue
            console.error('[OnboardingController] Signup error:', result.error)
          }
        }
        
        // Wait briefly for auth to propagate
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error('[OnboardingController] Account creation error:', error)
        // Continue anyway - user might already exist
      }
    }
    
    // Save name and advance (non-blocking - will retry if user not ready)
    const saved = await saveProgress('vibe')
    // Always advance - saveProgress now allows navigation even if save fails
    router.replace(`/onboarding?step=vibe`)
  }

  // Vibe step handler
  const handleVibeSubmit = async (vibe: string) => {
    setVibe(vibe)
    await saveProgress('topic')
    // Always advance - saveProgress now allows navigation even if save fails
    router.replace(`/onboarding?step=topic`)
  }

  // Topic step handler
  const handleTopicSubmit = async (topic: string) => {
    setTopic(topic)
    await saveProgress('timeframe')
    // Always advance
    router.replace(`/onboarding?step=timeframe`)
  }

  // Timeframe step handler
  const handleTimeframeSubmit = async (timeframe: number | null) => {
    setTimeframe(timeframe)
    await saveProgress('confirmation')
    // Always advance
    router.replace(`/onboarding?step=confirmation`)
  }

  // Confirmation step handler - complete onboarding
  const handleConfirmationSubmit = async () => {
    await saveProgress('complete')
    // Always advance to chat
    router.replace('/chat')
  }

  // Go back handler
  const goBack = async () => {
    const currentIndex = STEP_ORDER.indexOf(state.step)
    if (currentIndex > 0) {
      const prevStep = STEP_ORDER[currentIndex - 1]
      setStep(prevStep)
      router.replace(`/onboarding?step=${prevStep}`)
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
                  loading={state.loading}
                  error={state.error}
                  onBack={canGoBack ? goBack : undefined}
                />
              )}

              {state.step === 'vibe' && (
                <VibeStep
                  selectedVibe={state.vibe}
                  onVibeChange={setVibe}
                  onSubmit={handleVibeSubmit}
                  loading={state.loading}
                  error={state.error}
                  onBack={canGoBack ? goBack : undefined}
                />
              )}

              {state.step === 'topic' && (
                <TopicStep
                  selectedTopic={state.topic}
                  onTopicChange={setTopic}
                  onSubmit={handleTopicSubmit}
                  loading={state.loading}
                  error={state.error}
                  onBack={canGoBack ? goBack : undefined}
                />
              )}

              {state.step === 'timeframe' && (
                <TimeframeStep
                  selectedTimeframe={state.timeframe}
                  onTimeframeChange={setTimeframe}
                  onSubmit={handleTimeframeSubmit}
                  loading={state.loading}
                  error={state.error}
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
                  loading={state.loading}
                  error={state.error}
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
