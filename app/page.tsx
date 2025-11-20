"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(false)

  const handleGetToChatting = async () => {
    setCheckingAuth(true)
    
    // Small delay to ensure auth state is checked
    await new Promise(resolve => setTimeout(resolve, 100))
    
    if (user && user.email_confirmed_at) {
      // User is authenticated and verified, go to main app
      router.push("/vibe")
    } else {
      // User not authenticated, go to login
      router.push("/login")
    }
    
    setCheckingAuth(false)
  }

  // Show minimal loading only while checking auth for button click
  // DO NOT show loading on initial page load - always show welcome screen
  if (checkingAuth) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-white/60">Loading...</p>
      </div>
    )
  }

  // Welcome screen - ALWAYS show this first, regardless of auth state
  return (
    <div className="fixed inset-0 bg-black w-full h-full overflow-hidden">
      <div className="w-full h-full flex items-center justify-center px-6 py-8">
        <div className="flex flex-col items-center gap-8 w-full max-w-md">
          {/* Title Section */}
          <div className="text-center space-y-3">
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-white leading-tight">
              Welcome to Narrative
            </h1>
            <p className="text-sm sm:text-base text-white/60 max-w-sm mx-auto">
              A phone-native space to match through vibes, share topics, and keep your closest circle alive.
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
