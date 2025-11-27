"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { OnboardingProvider } from "@/context/OnboardingContext"
import { OnboardingController } from "@/components/onboarding/OnboardingController"
import { checkOnboardingStatus } from "@/lib/user-helpers"

function OnboardingContent() {
  return (
    <OnboardingProvider>
      <OnboardingController />
    </OnboardingProvider>
  )
}

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return
    }

    // USER LOGGED OUT → Allow access to onboarding (they need to create account)
    // Account creation happens at password step, so they must be able to access onboarding
    if (!user) {
      setCheckingOnboarding(false)
      return
    }

    // USER LOGGED IN → Check if onboarding is complete
    async function checkOnboarding() {
      if (!user) return
      
      setCheckingOnboarding(true)
      
      try {
        // Check if onboarding was just completed (prevents redirect loops)
        let justCompleted = false
        try {
          if (typeof window !== 'undefined') {
            const completedFlag = localStorage.getItem('onboarding_just_completed')
            const completedTimestamp = parseInt(localStorage.getItem('onboarding_completed_timestamp') || '0', 10)
            const timeSinceCompletion = Date.now() - completedTimestamp
            
            // If flag exists and was set within last 30 seconds, trust it
            if (completedFlag === 'true' && timeSinceCompletion < 30000) {
              console.log('[OnboardingPage] ✅ Onboarding just completed (flag set), redirecting to /vibe')
              justCompleted = true
              // Clear the flag
              localStorage.removeItem('onboarding_just_completed')
              localStorage.removeItem('onboarding_completed_timestamp')
              router.replace("/vibe")
              return
            }
          }
        } catch (e) {
          console.warn('[OnboardingPage] Could not check completion flag:', e)
        }
        
        // Add retry logic with delays to handle save propagation
        // BUT: Add timeout to prevent hanging if API is slow
        type OnboardingCheckResult = { completed: boolean; step: string; record: any; apiError: boolean }
        let result: OnboardingCheckResult | null = null
        let apiError = false
        let timedOut = false
        
        // Set overall timeout (3 seconds max) to prevent hanging
        const timeoutPromise = new Promise<{ timeout: boolean }>((resolve) => {
          setTimeout(() => resolve({ timeout: true }), 3000)
        })
        
        const checkPromise = (async (): Promise<void> => {
          for (let attempt = 0; attempt < 3; attempt++) { // Reduced from 5 to 3 for faster UX
            const checkResult: OnboardingCheckResult = await checkOnboardingStatus(user.id)
            result = checkResult
            
            // If API error, retry once more
            if (checkResult.apiError) {
              console.warn(`[OnboardingPage] ⚠️ API error (attempt ${attempt + 1}/3)`)
              if (attempt < 2) {
                await new Promise(resolve => setTimeout(resolve, 300)) // Reduced delay
                continue
              }
              // Last attempt failed - mark as API error
              apiError = true
              break
            }
            
            // If completed, redirect to vibe
            if (checkResult.completed) {
              console.log('[OnboardingPage] Onboarding is complete, redirecting to /vibe')
              router.replace("/vibe")
              return
            }
            
            // If not complete and not last attempt, wait and retry
            if (attempt < 2) {
              await new Promise(resolve => setTimeout(resolve, 300)) // Reduced delay
            }
          }
        })()
        
        // Race between check and timeout
        const raceResult = await Promise.race([checkPromise, timeoutPromise])
        
        // If timeout occurred, allow access anyway (don't block onboarding)
        if (raceResult && typeof raceResult === 'object' && 'timeout' in raceResult && raceResult.timeout) {
          console.warn('[OnboardingPage] ⚠️ Check timeout - allowing access to prevent blocking')
          timedOut = true
        }

        // If timeout or API error, allow access (don't redirect - prevents loops)
        const hasApiError = result !== null && (result as OnboardingCheckResult).apiError
        if (timedOut || apiError || hasApiError) {
          console.warn('[OnboardingPage] ⚠️ API error or timeout - allowing access to prevent redirect loop')
          setCheckingOnboarding(false)
          return
        }

        // PART 4: Still incomplete after retries → allow access (OnboardingController will handle step routing)
        const finalResult = result as OnboardingCheckResult | null
        const dbStep = finalResult !== null ? finalResult.step : null // Don't default to 'email' - let OnboardingController handle it
        const clientStep = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('step') : null
        
        // PART 4: Log both client and DB steps before allowing access
        console.log('[OnboardingPage] 📊 Step comparison:', {
          userId: user.id,
          dbStep: dbStep || 'null',
          clientStep: clientStep || 'null',
          dbCompleted: finalResult?.completed || false,
          apiError: finalResult?.apiError || false,
        })
        
        // CRITICAL: Never redirect to email if user is already on a later step
        // This prevents the email loop
        if (clientStep && clientStep !== 'email' && clientStep !== 'start') {
          // User is already on a later step - trust the client state
          // Don't redirect even if DB says 'email' (DB might be stale)
          console.log('[OnboardingPage] ✅ User is on step', clientStep, '- allowing access without redirect (preventing email loop)')
          setCheckingOnboarding(false)
          return
        }
        
        // If DB step is null or 'email' and client has no step, that's fine - let OnboardingController initialize
        // If DB step is ahead of client, OnboardingController will sync it
        console.log('[OnboardingPage] Onboarding incomplete, allowing access. DB Step:', dbStep || 'null', 'Client Step:', clientStep || 'null')
        setCheckingOnboarding(false)
      } catch (error) {
        console.error('[OnboardingPage] Error checking onboarding:', error)
        // On error, allow access (let OnboardingController handle it)
        setCheckingOnboarding(false)
      }
    }

    checkOnboarding()
  }, [authLoading, user]) // Removed router from dependencies to prevent re-renders

  // Show loading while checking
  if (authLoading || checkingOnboarding) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0B0B0D',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.60)' }}>Loading...</p>
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: '#0B0B0D',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.60)' }}>Loading...</p>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
