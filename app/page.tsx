"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Redirect based on authentication status
  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated and email verified, redirect to vibe
        if (user.email_confirmed_at) {
          router.push("/vibe")
        } else {
          // User authenticated but email not verified, go to onboarding
          router.push("/onboarding")
        }
      }
      // If not authenticated, show welcome screen (don't redirect)
    }
  }, [user, loading, router])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-white/60">Loading...</p>
      </div>
    )
  }

  // If user is authenticated, show loading while redirecting
  if (user) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-white/60">Loading...</p>
      </div>
    )
  }

  // Welcome screen for unauthenticated users (Apple-style)
  return (
    <div className="fixed inset-0 bg-black overflow-hidden w-full h-full m-0 p-0 sm:flex sm:items-center sm:justify-center sm:p-4 sm:p-6">
      {/* Phone Frame Container */}
      <div className="phone-frame-container">
        {/* Phone Frame - Black & White */}
        <div className="phone-frame">
          {/* Phone Screen */}
          <div className="phone-screen">
            <div className="phone-content flex items-center justify-center text-center px-6 py-8 gap-6 overflow-hidden">
              {/* Welcome Content */}
              <div className="flex flex-col items-center gap-6 w-full">
                {/* Logo/Brand */}
                <div className="space-y-2">
                  <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-clip-text text-transparent leading-tight">
                    Narrative
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400/80 max-w-xs mx-auto">
                    Welcome to Narrative
                  </p>
                </div>

                {/* Action Buttons - Apple Style */}
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <Button
                    asChild
                    variant="primary"
                    size="lg"
                    className="w-full h-12 text-sm font-semibold tracking-wide bg-white text-slate-900 border border-white/70 shadow-lg hover:bg-white/95 transition-all"
                  >
                    <Link href="/onboarding">Sign Up</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="w-full h-12 text-sm font-semibold tracking-wide border-white/20 text-white hover:border-white/40 hover:bg-white/5"
                  >
                    <Link href="/login">Sign In</Link>
                  </Button>
                </div>

                {/* Subtle tagline */}
                <p className="text-[10px] text-slate-500/60 max-w-xs">
                  A phone-native space to match through vibes, share topics, and keep your closest circle alive.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
