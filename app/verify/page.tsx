"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function VerifyPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  // Redirect if user is verified
  useEffect(() => {
    if (!authLoading && user && user.email_confirmed_at) {
      // User is verified, redirect to /vibe
      router.push('/vibe')
    } else if (!authLoading && !user) {
      // Not logged in, redirect to landing page
      router.push('/')
    }
  }, [user, authLoading, router])

  // Check verification status periodically
  useEffect(() => {
    if (!user || user.email_confirmed_at) return

    const checkVerification = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email_confirmed_at) {
        // Email verified, redirect to /vibe
        router.push('/vibe')
      }
    }, 3000) // Check every 3 seconds

    return () => clearInterval(checkVerification)
  }, [user, router])

  const handleResendEmail = async () => {
    if (!user?.email) return

    setResending(true)
    setResendSuccess(false)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error('Error resending email:', error)
      } else {
        setResendSuccess(true)
        setTimeout(() => setResendSuccess(false), 5000)
      }
    } catch (err) {
      console.error('Error resending email:', err)
    } finally {
      setResending(false)
    }
  }

  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0c] flex items-center justify-center">
        <p className="text-[#f1f1f3]/60">Loading...</p>
      </div>
    )
  }

  // If user is verified or not logged in, they should be redirected
  if (!user || user.email_confirmed_at) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0c] overflow-hidden w-full h-full">
      <div className="w-full h-full flex items-center justify-center px-6 py-8">
        <div className="flex flex-col items-center gap-8 w-full max-w-md">
          <div className="text-center space-y-4">
            <div className="text-5xl mb-4">📧</div>
            <h1 className="text-3xl font-black tracking-tight text-[#f1f1f3]">
              Verify Your Email
            </h1>
            <p className="text-sm text-[#f1f1f3]/60 max-w-sm mx-auto">
              We sent a verification link to <strong className="text-[#f1f1f3]">{user.email}</strong>
            </p>
            <p className="text-xs text-[#f1f1f3]/50 max-w-xs mx-auto">
              Click the link in the email to verify your account. Once verified, you&apos;ll be automatically redirected.
            </p>
          </div>

          <div className="flex flex-col gap-4 w-full">
            <Button
              onClick={handleResendEmail}
              variant="outline"
              size="lg"
              disabled={resending}
              className="w-full h-12 text-sm font-semibold tracking-wide border-[#f1f1f3]/20 text-[#f1f1f3] hover:border-[#f1f1f3]/40 hover:bg-[#f1f1f3]/5"
            >
              {resending ? "Sending..." : resendSuccess ? "Email Sent!" : "Resend Verification Email"}
            </Button>

            <Link
              href="/"
              className="text-center text-xs text-[#f1f1f3]/60 hover:underline"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

