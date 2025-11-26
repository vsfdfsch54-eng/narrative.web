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

    // USER LOGGED OUT → Redirect to welcome page
    if (!user) {
      router.replace("/")
      return
    }

    // USER LOGGED IN → Check if onboarding is complete
    async function checkOnboarding() {
      if (!user) return
      
      setCheckingOnboarding(true)
      
      try {
        const record = await getAppUserRecord(user.id)
        const step = normalizeOnboardingStep(record?.onboarding_step ?? null)
        const completed = step === 'complete' || record?.onboarding_completed === true

        if (completed) {
          // Onboarding complete → redirect to /vibe
          router.replace("/vibe")
          return
        }

        // Onboarding incomplete → allow access (OnboardingController will handle step routing)
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
