"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { OnboardingProvider } from "@/context/OnboardingContext"
import { OnboardingController } from "@/components/onboarding/OnboardingController"
import { normalizeOnboardingStep } from "@/lib/onboarding"
import { getAppUserRecord } from "@/lib/user-helpers"

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
      
      // If we're in the process of completing, don't check - let the completion handler navigate
      if (isCompleting) {
        console.log('[OnboardingPage] Completion in progress, skipping check')
        setCheckingOnboarding(false)
        return
      }
      
      setCheckingOnboarding(true)
      
      try {
        // Add retry logic with delays to handle save propagation
        let record = null
        let completed = false
        
        for (let attempt = 0; attempt < 3; attempt++) {
          record = await getAppUserRecord(user.id)
          const step = normalizeOnboardingStep(record?.onboarding_step ?? null)
          completed = step === 'complete' || record?.onboarding_completed === true
          
          if (completed) {
            console.log('[OnboardingPage] Onboarding is complete, redirecting to /vibe')
            router.replace("/vibe")
            return
          }
          
          // If not complete and not last attempt, wait and retry
          if (attempt < 2) {
            await new Promise(resolve => setTimeout(resolve, 400))
          }
        }

        // Still incomplete after retries → allow access (OnboardingController will handle step routing)
        console.log('[OnboardingPage] Onboarding incomplete, allowing access. Step:', normalizeOnboardingStep(record?.onboarding_step ?? null))
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
