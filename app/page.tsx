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
  // But show welcome page first, then redirect (for better UX)
  useEffect(() => {
    if (!loading && user) {
      // Small delay to show welcome page briefly before redirect
      const redirectTimer = setTimeout(() => {
        if (user.email_confirmed_at) {
          // User is logged in AND verified → go to /vibe
          router.push("/vibe")
        } else {
          // User is logged in but NOT verified → go to /verify
          router.push("/verify")
        }
      }, 500) // Brief delay to show welcome page
      
      return () => clearTimeout(redirectTimer)
    }
    // If user is not logged in, show welcome screen (no redirect)
  }, [user, loading, router])

  const handleGetToChatting = async () => {
    setCheckingAuth(true)
    
    // Small delay to ensure auth state is checked
    await new Promise(resolve => setTimeout(resolve, 100))
    
    if (user && user.email_confirmed_at) {
      // User is logged in AND verified → go directly to /vibe
      router.push("/vibe")
    } else if (user && !user.email_confirmed_at) {
      // User is logged in but NOT verified → go to /verify
      router.push("/verify")
    } else {
      // User not authenticated → go to login
      router.push("/login")
    }
    
    setCheckingAuth(false)
  }

  // Show loading only while auth is loading
  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0c] flex items-center justify-center">
        <p className="text-[#f1f1f3]/60">Loading...</p>
      </div>
    )
  }

  // Show minimal loading only while checking auth for button click
  if (checkingAuth) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0c] flex items-center justify-center">
        <p className="text-[#f1f1f3]/60">Loading...</p>
      </div>
    )
  }

  // Welcome screen - always show if user is NOT authenticated
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
              onClick={handleGetToChatting}
              variant="outline"
              size="lg"
              disabled={checkingAuth}
              className="w-full h-14 text-base font-semibold tracking-wide border-[#f1f1f3]/20 text-[#f1f1f3] hover:border-[#f1f1f3]/40 hover:bg-[#f1f1f3]/5 flex items-center justify-center"
            >
              {checkingAuth ? "Loading..." : "Get to Chatting"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
