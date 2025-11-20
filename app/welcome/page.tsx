"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"

export default function WelcomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      if (user && user.email_confirmed_at) {
        // Check if onboarding is complete
        const checkOnboarding = async () => {
          try {
            const response = await fetch(`/api/users?userId=${user.id}`)
            const data = await response.json()
            
            if (data.success && data.data) {
              const hasName = data.data.name
              const hasInterests = data.data.interests && data.data.interests.length > 0
              
              if (hasName && hasInterests) {
                router.push("/vibe")
              } else {
                router.push("/onboarding")
              }
            } else {
              router.push("/onboarding")
            }
          } catch (err) {
            router.push("/onboarding")
          }
        }
        
        checkOnboarding()
      } else {
        router.push("/")
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [user, router])

  const handleContinue = () => {
    if (user && user.email_confirmed_at) {
      // Check if onboarding is complete
      const checkOnboarding = async () => {
        try {
          const response = await fetch(`/api/users?userId=${user.id}`)
          const data = await response.json()
          
          if (data.success && data.data) {
            const hasName = data.data.name
            const hasInterests = data.data.interests && data.data.interests.length > 0
            
            if (hasName && hasInterests) {
              router.push("/vibe")
            } else {
              router.push("/onboarding")
            }
          } else {
            router.push("/onboarding")
          }
        } catch (err) {
          router.push("/onboarding")
        }
      }
      
      checkOnboarding()
    } else {
      router.push("/")
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-[#E5E5E5]/60">Loading...</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] w-full h-full overflow-hidden">
      <div className="w-full h-full flex items-center justify-center px-6 py-8">
        <div className="flex flex-col items-center gap-8 w-full max-w-md text-center">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Welcome to Narrative
            </h1>
            <p className="text-base sm:text-lg text-[#E5E5E5]/80 max-w-md mx-auto">
              You&apos;re all set. Enjoy your connections.
            </p>
          </div>

          <Button
            onClick={handleContinue}
            variant="primary"
            size="lg"
            className="w-full h-14 text-base font-semibold tracking-wide bg-[#E5E5E5] text-[#0A0A0A] border border-white shadow-lg hover:bg-white/95 transition-all"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}

