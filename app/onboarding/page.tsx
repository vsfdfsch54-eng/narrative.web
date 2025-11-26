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
        
        // Add retry logic with delays to handle save propagation (increased for mobile)
        let result = null
        let apiError = false
        
        for (let attempt = 0; attempt < 5; attempt++) { // Increased from 3 to 5
          result = await checkOnboardingStatus(user.id)
          
          // If API error, retry once more
          if (result.apiError) {
            console.warn(`[OnboardingPage] ⚠️ API error (attempt ${attempt + 1}/5)`)
            if (attempt < 4) {
              await new Promise(resolve => setTimeout(resolve, 500)) // Increased delay
              continue
            }
            // Last attempt failed - mark as API error
            apiError = true
            break
          }
          
          // If completed, redirect to vibe
          if (result.completed) {
            console.log('[OnboardingPage] Onboarding is complete, redirecting to /vibe')
            router.replace("/vibe")
            return
          }
          
          // If not complete and not last attempt, wait longer and retry (mobile networks are slower)
          if (attempt < 4) {
            await new Promise(resolve => setTimeout(resolve, 500)) // Increased from 400ms to 500ms
          }
        }

        // If API error, allow access (don't redirect - prevents loops)
        if (apiError || (result && result.apiError)) {
          console.warn('[OnboardingPage] ⚠️ API error - allowing access to prevent redirect loop')
          setCheckingOnboarding(false)
          return
        }

        // Still incomplete after retries → allow access (OnboardingController will handle step routing)
        console.log('[OnboardingPage] Onboarding incomplete, allowing access. Step:', result?.step || 'email')
        setCheckingOnboarding(false)
      } catch (error) {
        console.error('[OnboardingPage] Error checking onboarding:', error)
        // On error, allow access (let OnboardingController handle it)
        setCheckingOnboarding(false)
      }
    }

    checkOnboarding()
  }, [authLoading, user, router])

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
