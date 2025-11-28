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
  const isSavingRef = useRef(false) // PART 3: Prevent concurrent saves

  // Redirect if onboarding is complete - ALWAYS redirect to /topic-match
  useEffect(() => {
    if (authLoading || !user || !state.initialized) return
    if (hasRedirectedRef.current) return
    
    // Check if user is already completed
    if (state.step === 'complete') {
      hasRedirectedRef.current = true
      router.replace('/topic-match')
      // Fallback navigation
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname !== '/topic-match') {
          window.location.href = '/topic-match'
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
            router.replace('/topic-match')
            // Fallback navigation
            setTimeout(() => {
              if (typeof window !== 'undefined' && window.location.pathname !== '/topic-match') {
                window.location.href = '/topic-match'
              }
            }, 100)
          }
        }
      } catch (error) {
        console.error('[OnboardingController] Error checking completion:', error)
      }
    }

    checkCompletion()
  }, [user, authLoading, state.initialized, state.step, router]) // Include router in dependencies

  // Initialize from URL or database
  useEffect(() => {
    if (authLoading || !state.initialized) return
    if (hasInitializedRef.current) return

    // Check URL parameter first
    const urlStep = searchParams.get('step')
    if (urlStep && isValidOnboardingStep(urlStep)) {
      const normalizedStep = normalizeOnboardingStep(urlStep)
      // CRITICAL: Never reset to 'email' if user is already on a later step
      // This prevents the email loop
      if (normalizedStep === 'email' && state.step !== 'email' && state.step !== 'start') {
        console.log('[OnboardingController] ⚠️ URL says "email" but user is on', state.step, '- preserving current step (preventing email loop)')
        // Update URL to match current step instead
        if (typeof window !== 'undefined') {
          const currentUrl = new URL(window.location.href)
          currentUrl.searchParams.set('step', state.step)
          window.history.replaceState({}, '', currentUrl.toString())
        }
      } else if (normalizedStep !== state.step) {
        setStep(normalizedStep)
        // Update URL to match (in case it was invalid)
        if (typeof window !== 'undefined') {
          const currentUrl = new URL(window.location.href)
          currentUrl.searchParams.set('step', normalizedStep)
          window.history.replaceState({}, '', currentUrl.toString())
        }
      }
    } else if (!urlStep && state.step) {
      // If URL has no step but context has one, update URL to match context
      if (typeof window !== 'undefined') {
        const currentUrl = new URL(window.location.href)
        currentUrl.searchParams.set('step', state.step)
        window.history.replaceState({}, '', currentUrl.toString())
      }
    }

    hasInitializedRef.current = true
  }, [authLoading, state.initialized, state.step, searchParams, setStep])

  // PART 3: Verify step was saved to database
  // CRITICAL: Add delay before first check to allow DB replication
  const verifyStepSaved = async (expectedStep: OnboardingStep, userId: string, retries = 3): Promise<boolean> => {
    // Wait 300ms before first check to allow database write to propagate
    await new Promise(resolve => setTimeout(resolve, 300))
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(`/api/users?userId=${userId}`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(10000) // Increased timeout for slow networks
        })
        
        if (!response.ok) {
          console.warn(`[OnboardingController] Verification attempt ${attempt + 1}/${retries} - HTTP error:`, response.status, response.statusText)
          // Continue to retry
        } else {
          const data = await response.json()
          
          if (data.success && data.data) {
            const dbStep = normalizeOnboardingStep(data.data.onboarding_step)
            if (dbStep === expectedStep) {
              console.log(`[OnboardingController] ✅ Step verified (attempt ${attempt + 1}/${retries}):`, {
                userId,
                expectedStep,
                dbStep,
                match: true
              })
              return true
            } else {
              console.warn(`[OnboardingController] ⚠️ Step mismatch (attempt ${attempt + 1}/${retries}):`, {
                userId,
                expectedStep,
                dbStep,
                rawDbStep: data.data.onboarding_step,
                match: false
              })
            }
          } else {
            console.warn(`[OnboardingController] Verification attempt ${attempt + 1}/${retries} - No data returned:`, data)
          }
        }
      } catch (error: any) {
        // Check if it's a CORS/network error
        if (error.message?.includes('Load failed') || error.message?.includes('access control') || error.message?.includes('CORS')) {
          console.error(`[OnboardingController] ❌ CORS/Network error during verification (attempt ${attempt + 1}/${retries}):`, error.message)
          // For CORS errors, we can't verify, so return false but log it
          if (attempt === retries - 1) {
            console.error('[OnboardingController] ❌ Verification failed due to CORS/network errors - saves may not be working')
            return false
          }
        } else {
          console.warn(`[OnboardingController] Verification attempt ${attempt + 1}/${retries} failed:`, error.message)
        }
      }
      
      // Wait before retry (except on last attempt) - longer delay for DB replication
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 800)) // Increased to 800ms for better DB replication
      }
    }
    
    console.error('[OnboardingController] ❌ Step verification failed after all retries:', {
      userId,
      expectedStep
    })
    return false
  }

  // Helper function for reliable navigation with fallback
  const navigateToStep = (step: OnboardingStep) => {
    const route = `/onboarding?step=${step}`
    // PART 3: Update step in context AFTER DB save (not before)
    // This is now called after verification, so it's safe
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
  // PART 3: Wait for save and verification before navigating
  const handleEmailSubmit = async (email: string): Promise<void> => {
    if (isSavingRef.current) {
      console.warn('[OnboardingController] ⚠️ Save already in progress, ignoring duplicate request')
      return
    }
    
    isSavingRef.current = true
    setEmail(email)
    
    try {
      // 🔍 DEBUG: Verbose logging
      console.log('[OnboardingController] 📝 Email step: saving progress...', {
        email,
        currentStep: state.step,
        nextStep: 'password',
        hasUser: !!user?.id,
        userId: user?.id,
        timestamp: new Date().toISOString(),
        callStack: new Error().stack?.split('\n').slice(1, 4).join(' → ')
      })
      
      // PART 3: Wait for save to complete (if user exists)
      if (user?.id) {
        try {
          const response = await fetch('/api/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              email: email,
              onboarding_step: 'password',
            }),
            cache: 'no-store',
          })
          
          if (!response.ok) {
            console.error('[OnboardingController] ❌ Save email error - HTTP error:', response.status, response.statusText)
            const errorText = await response.text()
            console.error('[OnboardingController] Error response body:', errorText)
            // Still navigate - don't block UX
          } else {
            const data = await response.json()
            
            if (!data.success) {
              console.error('[OnboardingController] ❌ Save email error:', data.error)
              // Still navigate - don't block UX
            } else {
              console.log('[OnboardingController] ✅ Email save successful:', {
                savedStep: data.data?.onboarding_step,
                savedCompleted: data.data?.onboarding_completed,
                expectedStep: 'password',
                stepMatches: data.data?.onboarding_step === 'password',
                timestamp: new Date().toISOString()
              })
              // PART 3: Verify the save (with delay for DB replication)
              const verified = await verifyStepSaved('password', user.id)
              console.log('[OnboardingController] 🔍 Email step verification result:', {
                verified,
                userId: user.id,
                timestamp: new Date().toISOString()
              })
            }
          }
        } catch (fetchError: any) {
          // CORS/Network errors
          if (fetchError.message?.includes('Load failed') || fetchError.message?.includes('access control') || fetchError.message?.includes('CORS') || fetchError.message?.includes('Failed to fetch')) {
            console.error('[OnboardingController] ❌ CRITICAL: CORS/Network error - save did NOT reach server:', fetchError.message)
            console.error('[OnboardingController] This means the database was NOT updated. Check Vercel CORS configuration.')
          } else {
            console.error('[OnboardingController] ❌ Save email error:', fetchError)
          }
          // Still navigate - don't block UX
        }
      }
      
      // Navigate after save completes
      navigateToStep('password')
    } catch (error: any) {
      console.error('[OnboardingController] Save email error:', error)
      // Still navigate - don't block UX
      navigateToStep('password')
    } finally {
      isSavingRef.current = false
    }
  }

  // Password step handler - create account here
  // PART 3: Wait for save and verification before navigating
  const handlePasswordSubmit = async (password: string): Promise<void> => {
    if (isSavingRef.current) {
      console.warn('[OnboardingController] ⚠️ Save already in progress, ignoring duplicate request')
      return
    }
    
    isSavingRef.current = true
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
          isSavingRef.current = false
          return // Don't navigate if signup failed
        }
        
        // Wait briefly for auth to propagate (reduced to 300ms for faster UX)
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error: any) {
        // Signup failed - show error to user
        const errorMessage = error?.message || 'Failed to create account. Please try again.'
        setPasswordError(errorMessage)
        console.error('[OnboardingController] Account creation error:', error)
        isSavingRef.current = false
        return // Don't navigate if signup failed
      }
    }
    
    // PART 3: Wait for save to complete before navigating
    // Get current user ID (might have been created by signUp)
    let currentUserId = user?.id
    
    // CRITICAL: If user was just created, ensure user record exists in database
    // Call GET /api/users to create the user record if it doesn't exist
    if (currentUserId) {
      try {
        console.log('[OnboardingController] 🔍 Ensuring user record exists after signup...', { userId: currentUserId })
        const getUserResponse = await fetch(`/api/users?userId=${currentUserId}`, {
          method: 'GET',
          cache: 'no-store',
        })
        
        if (!getUserResponse.ok) {
          console.error('[OnboardingController] ❌ Failed to ensure user record exists:', await getUserResponse.text())
        } else {
          const getUserData = await getUserResponse.json()
          if (getUserData.success) {
            console.log('[OnboardingController] ✅ User record exists or was created')
          }
        }
      } catch (error) {
        console.error('[OnboardingController] ❌ Error ensuring user record exists:', error)
        // Continue anyway - PUT might still work
      }
    }
    
    if (!currentUserId) {
      console.warn('[OnboardingController] ⚠️ No user ID after signup, navigating anyway')
      navigateToStep('name')
      isSavingRef.current = false
      return
    }
    
    try {
      // PART 5: Verbose logging
      console.log('[OnboardingController] 📝 Password step: saving progress...', {
        userId: currentUserId,
        email: state.email,
        nextStep: 'name'
      })
      
      try {
        const response = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUserId,
            email: state.email,
            onboarding_step: 'name',
          }),
          cache: 'no-store',
        })
        
        if (!response.ok) {
          console.error('[OnboardingController] ❌ Save name step error - HTTP error:', response.status, response.statusText)
          const errorText = await response.text()
          console.error('[OnboardingController] Error response body:', errorText)
          // Still navigate - don't block UX
        } else {
          const data = await response.json()
          
          if (!data.success) {
            console.error('[OnboardingController] ❌ Save name step error:', data.error)
            // Still navigate - don't block UX
          } else {
            console.log('[OnboardingController] ✅ Name step save successful:', {
              savedStep: data.data?.onboarding_step,
              savedCompleted: data.data?.onboarding_completed,
            })
            // PART 3: Verify the save (with delay for DB replication)
            await verifyStepSaved('name', currentUserId)
          }
        }
      } catch (fetchError: any) {
        if (fetchError.message?.includes('Load failed') || fetchError.message?.includes('access control') || fetchError.message?.includes('CORS') || fetchError.message?.includes('Failed to fetch')) {
          console.error('[OnboardingController] ❌ CRITICAL: CORS/Network error - save did NOT reach server:', fetchError.message)
        } else {
          console.error('[OnboardingController] ❌ Save name step error:', fetchError)
        }
        // Still navigate - don't block UX
      }
      
      // Navigate after save completes
      navigateToStep('name')
    } catch (error: any) {
      console.error('[OnboardingController] Save name step error:', error)
      // Still navigate - don't block UX
      navigateToStep('name')
    } finally {
      isSavingRef.current = false
    }
  }

  // Name step handler - PART 3: Wait for save and verification before navigating
  const handleNameSubmit = async (firstName: string, lastName: string) => {
    if (isSavingRef.current) {
      console.warn('[OnboardingController] ⚠️ Save already in progress, ignoring duplicate request')
      return
    }
    
    isSavingRef.current = true
    setFirstName(firstName)
    setLastName(lastName)
    
    if (!user?.id) {
      console.warn('[OnboardingController] ⚠️ No user ID, navigating anyway')
      navigateToStep('questions')
      isSavingRef.current = false
      return
    }
    
    try {
      // PART 5: Verbose logging
      console.log('[OnboardingController] 📝 Name step: saving progress...', {
        userId: user.id,
        firstName,
        lastName,
        nextStep: 'questions'
      })
      
      try {
        const response = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            firstName,
            lastName,
            onboarding_step: 'questions',
          }),
          cache: 'no-store',
        })
        
        if (!response.ok) {
          console.error('[OnboardingController] ❌ Save progress error - HTTP error:', response.status, response.statusText)
          const errorText = await response.text()
          console.error('[OnboardingController] Error response body:', errorText)
        } else {
          const data = await response.json()
          
          if (!data.success) {
            console.error('[OnboardingController] ❌ Save progress error:', data.error)
          } else {
            console.log('[OnboardingController] ✅ Questions step save successful:', {
              savedStep: data.data?.onboarding_step,
              savedCompleted: data.data?.onboarding_completed,
            })
            // PART 3: Verify the save (with delay for DB replication)
            await verifyStepSaved('questions', user.id)
          }
        }
      } catch (fetchError: any) {
        if (fetchError.message?.includes('Load failed') || fetchError.message?.includes('access control') || fetchError.message?.includes('CORS') || fetchError.message?.includes('Failed to fetch')) {
          console.error('[OnboardingController] ❌ CRITICAL: CORS/Network error - save did NOT reach server:', fetchError.message)
        } else {
          console.error('[OnboardingController] ❌ Save progress error:', fetchError)
        }
      }
      
      navigateToStep('questions')
    } catch (error: any) {
      console.error('[OnboardingController] Save progress error:', error)
      navigateToStep('questions')
    } finally {
      isSavingRef.current = false
    }
  }

  // Questions step handler - PART 3: Wait for save and verification before navigating
  const handleQuestionsSubmit = async (answers: Record<string, string>) => {
    if (isSavingRef.current) {
      console.warn('[OnboardingController] ⚠️ Save already in progress, ignoring duplicate request')
      return
    }
    
    isSavingRef.current = true
    setQuestionsAnswers(answers)
    
    if (!user?.id) {
      console.warn('[OnboardingController] ⚠️ No user ID, navigating anyway')
      navigateToStep('interests')
      isSavingRef.current = false
      return
    }
    
    try {
      // PART 5: Verbose logging
      console.log('[OnboardingController] 📝 Questions step: saving progress...', {
        userId: user.id,
        answersCount: Object.keys(answers).length,
        nextStep: 'interests'
      })
      
      try {
        const response = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            questionsAnswers: answers,
            onboarding_step: 'interests',
          }),
          cache: 'no-store',
        })
        
        if (!response.ok) {
          console.error('[OnboardingController] ❌ Save progress error - HTTP error:', response.status, response.statusText)
          const errorText = await response.text()
          console.error('[OnboardingController] Error response body:', errorText)
        } else {
          const data = await response.json()
          
          if (!data.success) {
            console.error('[OnboardingController] ❌ Save progress error:', data.error)
          } else {
            console.log('[OnboardingController] ✅ Interests step save successful:', {
              savedStep: data.data?.onboarding_step,
              savedCompleted: data.data?.onboarding_completed,
            })
            // PART 3: Verify the save (with delay for DB replication)
            await verifyStepSaved('interests', user.id)
          }
        }
      } catch (fetchError: any) {
        if (fetchError.message?.includes('Load failed') || fetchError.message?.includes('access control') || fetchError.message?.includes('CORS') || fetchError.message?.includes('Failed to fetch')) {
          console.error('[OnboardingController] ❌ CRITICAL: CORS/Network error - save did NOT reach server:', fetchError.message)
        } else {
          console.error('[OnboardingController] ❌ Save progress error:', fetchError)
        }
      }
      
      navigateToStep('interests')
    } catch (error: any) {
      console.error('[OnboardingController] Save progress error:', error)
      navigateToStep('interests')
    } finally {
      isSavingRef.current = false
    }
  }

  // Interests step handler - PART 3: Wait for save and verification before navigating
  const handleInterestsSubmit = async (interests: string[]) => {
    if (isSavingRef.current) {
      console.warn('[OnboardingController] ⚠️ Save already in progress, ignoring duplicate request')
      return
    }
    
    isSavingRef.current = true
    setInterests(interests)
    
    if (!user?.id) {
      console.warn('[OnboardingController] ⚠️ No user ID, navigating anyway')
      navigateToStep('confirmation')
      isSavingRef.current = false
      return
    }
    
    try {
      // PART 5: Verbose logging
      console.log('[OnboardingController] 📝 Interests step: saving progress...', {
        userId: user.id,
        interestsCount: interests.length,
        nextStep: 'confirmation'
      })
      
      try {
        const response = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            interests,
            onboarding_step: 'confirmation',
          }),
          cache: 'no-store',
        })
        
        if (!response.ok) {
          console.error('[OnboardingController] ❌ Save progress error - HTTP error:', response.status, response.statusText)
          const errorText = await response.text()
          console.error('[OnboardingController] Error response body:', errorText)
        } else {
          const data = await response.json()
          
          if (!data.success) {
            console.error('[OnboardingController] ❌ Save progress error:', data.error)
          } else {
            console.log('[OnboardingController] ✅ Confirmation step save successful:', {
              savedStep: data.data?.onboarding_step,
              savedCompleted: data.data?.onboarding_completed,
            })
            // PART 3: Verify the save (with delay for DB replication)
            await verifyStepSaved('confirmation', user.id)
          }
        }
      } catch (fetchError: any) {
        if (fetchError.message?.includes('Load failed') || fetchError.message?.includes('access control') || fetchError.message?.includes('CORS') || fetchError.message?.includes('Failed to fetch')) {
          console.error('[OnboardingController] ❌ CRITICAL: CORS/Network error - save did NOT reach server:', fetchError.message)
        } else {
          console.error('[OnboardingController] ❌ Save progress error:', fetchError)
        }
      }
      
      navigateToStep('confirmation')
    } catch (error: any) {
      console.error('[OnboardingController] Save progress error:', error)
      navigateToStep('confirmation')
    } finally {
      isSavingRef.current = false
    }
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
        router.replace('/topic-match')
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.location.pathname !== '/topic-match') {
            window.location.href = '/topic-match'
          }
        }, 100)
        return
      }
      
      // Save synchronously for completion step - MUST wait for this
      // Get current state values to ensure we're using the latest
      const currentFirstName = state.firstName || undefined
      const currentLastName = state.lastName || undefined
      const currentQuestionsAnswers = Object.keys(state.questionsAnswers).length > 0 ? state.questionsAnswers : undefined
      const currentInterests = state.interests.length > 0 ? state.interests : undefined
      const currentEmail = state.email || undefined
      
      console.log('[OnboardingController] Saving completion to database...', {
        userId: user.id,
        step: 'complete',
        completed: true,
        firstName: currentFirstName,
        lastName: currentLastName,
        hasQuestions: !!currentQuestionsAnswers,
        interestsCount: currentInterests?.length || 0,
      })
      
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          firstName: currentFirstName,
          lastName: currentLastName,
          questionsAnswers: currentQuestionsAnswers,
          interests: currentInterests,
          onboarding_step: 'complete',
          onboarding_completed: true,
          email: currentEmail,
        }),
      })
      
      const data = await response.json()
      
      if (!data.success) {
        console.error('[OnboardingController] ❌ Save completion FAILED:', data.error)
        console.error('[OnboardingController] Response details:', {
          success: data.success,
          error: data.error,
          details: data.details,
          status: response.status,
        })
        
        // Retry save once before giving up
        console.log('[OnboardingController] Retrying completion save...')
        try {
          const retryResponse = await fetch('/api/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              firstName: currentFirstName,
              lastName: currentLastName,
              questionsAnswers: currentQuestionsAnswers,
              interests: currentInterests,
              onboarding_step: 'complete',
              onboarding_completed: true,
              email: currentEmail,
            }),
          })
          const retryData = await retryResponse.json()
          
          if (retryData.success) {
            console.log('[OnboardingController] ✅ Retry save succeeded')
          } else {
            console.error('[OnboardingController] ❌ Retry save also failed:', retryData.error)
            // Still set flag to allow user to proceed
            try {
              if (typeof window !== 'undefined') {
                localStorage.setItem('onboarding_just_completed', 'true')
                localStorage.setItem('onboarding_completed_timestamp', String(Date.now()))
                console.log('[OnboardingController] Set localStorage flag despite retry failure')
              }
            } catch (e) {
              // Ignore
            }
          }
        } catch (retryError) {
          console.error('[OnboardingController] ❌ Retry save error:', retryError)
          // Still set flag to allow user to proceed
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem('onboarding_just_completed', 'true')
              localStorage.setItem('onboarding_completed_timestamp', String(Date.now()))
            }
          } catch (e) {
            // Ignore
          }
        }
      } else {
        console.log('[OnboardingController] ✅ Completion saved successfully')
        console.log('[OnboardingController] Save response:', {
          success: data.success,
          hasData: !!data.data,
          userId: data.data?.id,
          onboarding_step: data.data?.onboarding_step,
          onboarding_completed: data.data?.onboarding_completed,
        })
        
        // CRITICAL: Verify the saved data matches what we sent
        if (data.data?.onboarding_step !== 'complete') {
          console.error('[OnboardingController] ❌ CRITICAL: Saved onboarding_step is not "complete"!', {
            savedStep: data.data?.onboarding_step,
            expectedStep: 'complete',
            savedCompleted: data.data?.onboarding_completed
          })
        } else {
          console.log('[OnboardingController] ✅ Verified: Saved onboarding_step is "complete"')
        }
      }
      
      // Wait longer to ensure database write is committed and propagated (especially on mobile)
      await new Promise(resolve => setTimeout(resolve, 2000)) // Increased to 2 seconds for mobile
      
      // Verify the save worked by checking the database (with retries for mobile)
      let verified = false
      for (let verifyAttempt = 0; verifyAttempt < 10; verifyAttempt++) {
        try {
          const verifyResponse = await fetch(`/api/users?userId=${user.id}`, {
            cache: 'no-store',
            signal: AbortSignal.timeout(10000)
          })
          const verifyData = await verifyResponse.json()
          
          if (verifyData.success && verifyData.data) {
            const dbStep = normalizeOnboardingStep(verifyData.data.onboarding_step)
            const dbCompleted = dbStep === 'complete' || verifyData.data.onboarding_completed === true
            
            if (dbCompleted) {
              console.log(`[OnboardingController] ✅ Save verified (attempt ${verifyAttempt + 1}/10) - onboarding is complete`)
              verified = true
              break
            } else {
              console.warn(`[OnboardingController] ⚠️ Verification attempt ${verifyAttempt + 1}/10 - step is:`, dbStep, 'completed:', verifyData.data.onboarding_completed, 'raw step:', verifyData.data.onboarding_step)
            }
          } else {
            console.warn(`[OnboardingController] ⚠️ Verification attempt ${verifyAttempt + 1}/10 - no data returned`)
          }
        } catch (verifyError: any) {
          console.warn(`[OnboardingController] Verification attempt ${verifyAttempt + 1}/10 failed:`, verifyError.message)
        }
        
        // Wait before retry (longer delays for mobile)
        if (verifyAttempt < 9) {
          await new Promise(resolve => setTimeout(resolve, 1000)) // Increased to 1 second between retries
        }
      }
      
      if (!verified) {
        console.error('[OnboardingController] ❌ CRITICAL: Could not verify save after 10 attempts!')
        console.error('[OnboardingController] This means completion might not have saved correctly.')
        console.error('[OnboardingController] Check server logs for saveOnboardingProgress errors.')
        // Still set the flag even if verification failed (allows user to proceed)
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('onboarding_just_completed', 'true')
            localStorage.setItem('onboarding_completed_timestamp', String(Date.now()))
          }
        } catch (e) {
          // Ignore
        }
      } else {
        // Only set flag if verification succeeded
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('onboarding_just_completed', 'true')
            localStorage.setItem('onboarding_completed_timestamp', String(Date.now()))
            console.log('[OnboardingController] ✅ Completion verified and flag set')
          }
        } catch (e) {
          console.warn('[OnboardingController] Could not set localStorage flag:', e)
        }
      }
    } catch (error) {
      console.error('[OnboardingController] ❌ Save completion error:', error)
      // Set flag even on error to allow user to proceed
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('onboarding_just_completed', 'true')
          localStorage.setItem('onboarding_completed_timestamp', String(Date.now()))
        }
      } catch (e) {
        // Ignore
      }
    }
    
    // Navigate to topic-match after save completes and is verified
    // Use window.location.href for hard navigation to prevent redirect loops
    console.log('[OnboardingController] Navigating to /topic-match...')
    
    // Use hard navigation to ensure clean state
    if (typeof window !== 'undefined') {
      window.location.href = '/topic-match'
    } else {
      router.replace('/topic-match')
    }
  }

  // Go back handler - with fallback navigation
  const goBack = async () => {
    const currentIndex = STEP_ORDER.indexOf(state.step)
    if (currentIndex > 0) {
      const prevStep = STEP_ORDER[currentIndex - 1]
      // Save the previous step to database (non-blocking)
      saveProgress(prevStep).catch((error) => {
        console.error('[OnboardingController] Save progress on goBack error:', error)
      })
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
