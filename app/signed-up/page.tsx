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
      <div className="fixed inset-0 bg-[#0a0a0c] flex items-center justify-center">
        <p className="text-[#f1f1f3]/60">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0c] w-full h-full overflow-hidden">
      <div className="w-full h-full flex items-center justify-center px-6 py-8">
        <div className="flex flex-col items-center gap-8 w-full max-w-md text-center">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#f1f1f3] leading-tight">
              You&apos;re all signed up
            </h1>
            <p className="text-base sm:text-lg text-[#f1f1f3]/80 max-w-md mx-auto">
              Welcome to Narrative.
            </p>
          </div>

          <Button
            onClick={handleContinue}
            variant="primary"
            size="lg"
            className="w-full h-14 text-base font-semibold tracking-wide bg-[#f1f1f3] text-[#0a0a0c] border border-[#f1f1f3] shadow-lg hover:bg-[#f1f1f3]/95 transition-all"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}

