"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"

export default function SignedUpPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
    }
  }, [user, authLoading, router])

  const handleContinue = () => {
    router.push("/vibe")
  }

  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-[#EDEDED]/60">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] w-full h-full overflow-hidden">
      <div className="w-full h-full flex items-center justify-center px-6 py-8">
        <div className="flex flex-col items-center gap-8 w-full max-w-md text-center">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#EDEDED] leading-tight">
              You&apos;re all signed up
            </h1>
            <p className="text-base sm:text-lg text-[#EDEDED]/80 max-w-md mx-auto">
              Welcome to Narrative.
            </p>
          </div>

          <Button
            onClick={handleContinue}
            variant="primary"
            size="lg"
            className="w-full h-14 text-base font-semibold tracking-wide bg-[#EDEDED] text-[#0A0A0A] border border-[#EDEDED] shadow-lg hover:bg-[#EDEDED]/95 transition-all"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}

