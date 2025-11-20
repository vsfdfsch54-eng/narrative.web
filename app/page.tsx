"use client"

import Link from "next/link"
import { motion } from "framer-motion"
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
      } else {
        // User is not authenticated, redirect to onboarding (signup)
        router.push("/onboarding")
      }
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

  // This should not render as we redirect, but keep as fallback
  return (
    <div className="fixed inset-0 bg-black overflow-hidden w-full h-full m-0 p-0 sm:flex sm:items-center sm:justify-center sm:p-4 sm:p-6">
      {/* Phone Frame Container */}
      <div className="phone-frame-container">
        {/* Phone Frame - Black & White */}
        <div className="phone-frame">
          {/* Phone Screen */}
          <div className="phone-screen">
            <div className="phone-content flex items-center justify-center text-center px-6 py-6 gap-4 overflow-hidden">
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="text-[11px] uppercase tracking-[0.4em] text-slate-400"
              >
                Human-first social
              </motion.span>

              <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-clip-text text-transparent leading-tight">
                Narrative
              </h1>

              <p className="text-xs text-slate-400/90 max-w-xs">
                A phone-native space to match through vibes, share topics, and keep your closest circle alive.
              </p>

              <div className="flex flex-col gap-2.5 w-full">
                <Button
                  asChild
                  variant="primary"
                  size="lg"
                  className="w-full h-11 text-sm font-semibold tracking-wide bg-white text-slate-900 border border-white/70 shadow-[0_15px_45px_rgba(0,0,0,0.45)] hover:-translate-y-0.5 transition-all"
                >
                  <Link href="/onboarding">Sign Up</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full h-11 text-sm font-semibold tracking-wide border-white/20 text-white hover:border-white/40 hover:bg-white/5"
                >
                  <Link href="/vibe">See the Flow</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
