"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // Route to V2 pages based on auth and onboarding status
  useEffect(() => {
    if (authLoading) return

    // Check if user has V2 schema version
    const checkV2Status = async () => {
      if (!user) {
        // Not logged in → redirect to V2 onboarding
        router.replace('/onboarding-v2')
        return
      }

      try {
        // Check user's schema version
        const response = await fetch(`/api/users?userId=${user.id}`)
        const data = await response.json()

        if (data.success && data.data) {
          const schemaVersion = data.data.schema_version || 'v1'
          const onboardingCompleted = data.data.onboarding_completed || false
          
          if (schemaVersion === 'v2' && onboardingCompleted) {
            // User is on V2 and completed → go to V2 home
            router.replace('/home-v2')
          } else {
            // User needs V2 onboarding
            router.replace('/onboarding-v2')
          }
        } else {
          // No user record → go to V2 onboarding
          router.replace('/onboarding-v2')
        }
      } catch (error) {
        console.error('[HomePage] Error checking V2 status:', error)
        // On error, default to V2 onboarding
        router.replace('/onboarding-v2')
      }
    }

    checkV2Status()
  }, [user, authLoading, router])

  // Show loading while checking
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#FAFAFA',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Loader2 style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite' }} />
    </div>
  )
}
