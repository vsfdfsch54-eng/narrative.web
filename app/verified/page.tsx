"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabaseClient"

export default function VerifiedPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkVerificationAndRedirect = async () => {
      // Wait a moment for session to be established
      await new Promise(resolve => setTimeout(resolve, 500))
      
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session && session.user && session.user.email_confirmed_at) {
          // Email is verified, check onboarding status
          try {
            const response = await fetch(`/api/users?userId=${session.user.id}`)
            const data = await response.json()
            
            if (data.success && data.data) {
              const hasName = data.data.name
              const hasInterests = data.data.interests && data.data.interests.length > 0
              
              if (hasName && hasInterests) {
                // Onboarding complete, redirect to /vibe
                router.push('/vibe')
              } else {
                // Need to complete onboarding
                router.push('/onboarding?verified=true')
              }
            } else {
              // No user data, need onboarding
              router.push('/onboarding?verified=true')
            }
          } catch (err) {
            // Error checking, go to onboarding
            router.push('/onboarding?verified=true')
          }
        } else {
          // Not verified or no session, redirect to onboarding
          router.push('/onboarding')
        }
      } catch (err) {
        // Error, redirect to onboarding
        router.push('/onboarding')
      } finally {
        setChecking(false)
      }
    }

    checkVerificationAndRedirect()
  }, [router])

  if (authLoading || checking) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-[#E5E5E5]/60">Verifying your email...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-[#E5E5E5]/60">Processing...</p>
      </div>
    </div>
  )
}

