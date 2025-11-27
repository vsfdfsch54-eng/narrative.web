"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/AppShell"
import { tokens } from "@/lib/design-tokens"
import { Loader2 } from "lucide-react"
import { checkOnboardingStatus } from "@/lib/user-helpers"

export default function ChatPage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  // Routing guard: Check auth and onboarding status
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

    // USER LOGGED IN → Check onboarding status
    async function checkOnboarding() {
      if (!user) return
      
      try {
        const { completed, step, apiError } = await checkOnboardingStatus(user.id)

        // NEVER redirect on API errors - causes redirect loops
        if (apiError) {
          console.warn('[ChatPage] ⚠️ API error checking onboarding - allowing access to prevent loop')
          // Allow access - don't redirect on API errors
          setLoading(false)
          return
        }

        if (!completed) {
          // Incomplete onboarding → redirect to onboarding
          // Safety check: prevent redirect loops
          const redirectPath = `/onboarding?step=${step}`
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
          if (currentPath === redirectPath) {
            console.warn('[ChatPage] ⚠️ Already on target path, skipping redirect to prevent loop')
            setLoading(false)
            return
          }
          router.replace(redirectPath)
          return
        }

        // Complete onboarding → redirect to match page (new matching system)
        router.replace("/match")
      } catch (error) {
        console.error('[ChatPage] Error checking onboarding:', error)
        // On error, allow access - don't redirect to prevent loops
        console.warn('[ChatPage] ⚠️ Error in checkOnboarding - redirecting to match')
        router.replace("/match")
      } finally {
        setLoading(false)
      }
    }

    checkOnboarding()
  }, [user, authLoading, router])

  if (authLoading || loading) {
    return (
      <AppShell>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: tokens.spacing[20],
        }}>
          <Loader2 style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite' }} />
        </div>
      </AppShell>
    )
  }

  return null
}
