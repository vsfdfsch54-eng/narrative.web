"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(false)

  // Redirect authenticated users away from landing page
  useEffect(() => {
    if (!loading && user && user.email_confirmed_at) {
      // Check if onboarding is complete
      const checkOnboarding = async () => {
        try {
          const response = await fetch(`/api/users?userId=${user.id}`)
          const data = await response.json()
          
          if (data.success && data.data) {
            const hasName = data.data.name
            const hasInterests = data.data.interests && data.data.interests.length > 0
            
            if (hasName && hasInterests) {
              // Onboarding complete, go to main app
              router.push("/vibe")
            } else {
              // Need to complete onboarding
              router.push("/onboarding")
            }
          } else {
            // No user data, need onboarding
            router.push("/onboarding")
          }
        } catch (err) {
          // Error checking, go to onboarding
          router.push("/onboarding")
        }
      }
      
      checkOnboarding()
    }
  }, [user, loading, router])

  const handleGetToChatting = async () => {
    setCheckingAuth(true)
    
    // Small delay to ensure auth state is checked
    await new Promise(resolve => setTimeout(resolve, 100))
    
    if (user && user.email_confirmed_at) {
      // User is authenticated and verified, check onboarding status
      try {
        const response = await fetch(`/api/users?userId=${user.id}`)
        const data = await response.json()
        
        if (data.success && data.data) {
          const hasName = data.data.name
          const hasInterests = data.data.interests && data.data.interests.length > 0
          
          if (hasName && hasInterests) {
            // Onboarding complete, go directly to /vibe
            router.push("/vibe")
          } else {
            // Need to complete onboarding
            router.push("/onboarding")
          }
        } else {
          // No user data, need onboarding
          router.push("/onboarding")
        }
      } catch (err) {
        // Error checking, go to onboarding
        router.push("/onboarding")
      }
    } else {
      // User not authenticated, go to login
      router.push("/login")
    }
    
    setCheckingAuth(false)
  }

  // Show loading while checking auth state
  if (loading || (user && user.email_confirmed_at)) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-white/60">Loading...</p>
      </div>
    )
  }

  // Show minimal loading only while checking auth for button click
  if (checkingAuth) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-white/60">Loading...</p>
      </div>
    )
  }

  // Landing screen - only show if user is NOT authenticated
  return (
    <div className="fixed inset-0 bg-black w-full h-full overflow-hidden">
      <div className="w-full h-full flex items-center justify-center px-6 py-8">
        <div className="flex flex-col items-center gap-8 w-full max-w-md">
          {/* Title Section */}
          <div className="text-center space-y-3">
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-white leading-tight">
              Welcome to Narrative.
            </h1>
            <p className="text-sm sm:text-base text-white/60 max-w-sm mx-auto">
              Where real connection begins.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 w-full">
            <Button
              asChild
              variant="primary"
              size="lg"
              className="w-full h-14 text-base font-semibold tracking-wide bg-white text-black border border-white shadow-lg hover:bg-white/95 transition-all"
            >
              <Link href="/onboarding">Create an Account</Link>
            </Button>
            
            <Button
              onClick={handleGetToChatting}
              variant="outline"
              size="lg"
              disabled={checkingAuth}
              className="w-full h-14 text-base font-semibold tracking-wide border-white/20 text-white hover:border-white/40 hover:bg-white/5"
            >
              {checkingAuth ? "Loading..." : "Get to Chatting"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
