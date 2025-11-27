"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { checkOnboardingStatus } from "@/lib/user-helpers"

export default function Home() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return
    }
    
    // USER LOGGED OUT → Show welcome page
    if (!user) {
      setCheckingOnboarding(false)
      return
    }
    
    // USER LOGGED IN → Check onboarding and redirect
    async function checkAndRedirect() {
      if (!user) return
      
      setCheckingOnboarding(true)
      
      try {
        const { completed, step, apiError } = await checkOnboardingStatus(user.id)
            
        // NEVER redirect on API errors - causes redirect loops
        if (apiError) {
          console.warn('[Home] ⚠️ API error checking onboarding - redirecting to /vibe to prevent loop')
          router.replace("/vibe")
          return
        }

        if (!completed) {
          // Incomplete onboarding → redirect to onboarding
          // Safety check: prevent redirect loops
          const redirectPath = `/onboarding?step=${step}`
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
          if (currentPath === redirectPath) {
            console.warn('[Home] ⚠️ Already on target path, skipping redirect to prevent loop')
            return
          }
          router.replace(redirectPath)
          return
        }

        // Complete onboarding → redirect to /vibe (never show welcome again)
        router.replace("/vibe")
      } catch (error) {
        console.error('[Home] Error checking onboarding:', error)
        // On error, redirect to /vibe (not onboarding) to prevent loops
        router.replace("/vibe")
        } finally {
        setCheckingOnboarding(false)
        }
      }
      
      checkAndRedirect()
  }, [authLoading, user]) // Removed router from dependencies to prevent re-renders

  // Show loading while checking auth or onboarding status
  if (authLoading || checkingOnboarding) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0c] flex items-center justify-center">
        <p className="text-[#f1f1f3]/60">Loading...</p>
      </div>
    )
  }

  // Welcome screen - only show if user is NOT authenticated
  // Logged-in users should never see this (they get redirected above)
  return (
    <div className="fixed inset-0 bg-[#0a0a0c] w-full h-full overflow-hidden">
      <div className="w-full h-full flex items-center justify-center px-6 py-8">
        <div className="flex flex-col items-center gap-8 w-full max-w-md">
          {/* Title Section */}
          <div className="text-center space-y-3">
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-[#f1f1f3] leading-tight">
              Welcome to Narrative
            </h1>
            <p className="text-sm sm:text-base text-[#f1f1f3]/60 max-w-sm mx-auto">
              Where real connection begins.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 w-full items-stretch">
            <Button
              asChild
              variant="primary"
              size="lg"
              className="w-full h-14 text-base font-semibold tracking-wide bg-[#f1f1f3] text-[#0a0a0c] border border-[#f1f1f3] shadow-lg hover:bg-[#f1f1f3]/95 transition-all flex items-center justify-center"
            >
              <Link href="/onboarding" className="w-full h-full flex items-center justify-center">Create an Account</Link>
            </Button>
            
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full h-14 text-base font-semibold tracking-wide border-[#f1f1f3]/20 text-[#f1f1f3] hover:border-[#f1f1f3]/40 hover:bg-[#f1f1f3]/5 flex items-center justify-center"
            >
              <Link href="/login" className="w-full h-full flex items-center justify-center">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
