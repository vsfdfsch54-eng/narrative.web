"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [checking, setChecking] = useState(false)

  // Auto-redirect authenticated users to appropriate page
  useEffect(() => {
    if (loading) return
    
    if (user) {
      setChecking(true)
      // Check onboarding step from database - single source of truth
      const checkAndRedirect = async () => {
        try {
          const response = await fetch(`/api/users?userId=${user.id}`)
          const data = await response.json()
          
          if (data.success && data.data) {
            const onboardingStep = data.data.onboarding_step || 'start'
            
            if (onboardingStep === 'complete') {
              // Onboarding complete → go to vibe
              router.push("/vibe")
            } else {
              // Onboarding incomplete → go to onboarding
              router.push("/onboarding")
            }
          } else {
            // User not found in database → go to onboarding
            router.push("/onboarding")
          }
        } catch (error) {
          // On error, redirect to onboarding to be safe
          router.push("/onboarding")
        } finally {
          setChecking(false)
        }
      }
      
      checkAndRedirect()
    }
  }, [user, loading, router])

  // Show loading while checking auth or onboarding status
  if (loading || checking) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0c] flex items-center justify-center">
        <p className="text-[#f1f1f3]/60">Loading...</p>
      </div>
    )
  }

  // Welcome screen - only show if user is NOT authenticated
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
