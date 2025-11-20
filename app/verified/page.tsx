"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function VerifiedPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'verified' | 'error'>('checking')

  useEffect(() => {
    const checkVerificationAndRedirect = async () => {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Error getting session:', sessionError)
          setStatus('error')
          setTimeout(() => router.push('/onboarding'), 2000)
          return
        }
        
        if (session && session.user && session.user.email_confirmed_at) {
          // Email is verified - show success message briefly then redirect to /vibe
          setStatus('verified')
          
          // Redirect to /vibe after 1.5 seconds
          setTimeout(() => {
            router.push('/vibe')
          }, 1500)
        } else {
          // Not verified or no session, redirect to onboarding
          router.push('/onboarding')
        }
      } catch (err) {
        console.error('Verification check error:', err)
        setStatus('error')
        setTimeout(() => router.push('/onboarding'), 2000)
      }
    }

    checkVerificationAndRedirect()
  }, [router])

  if (status === 'checking') {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-[#EDEDED]/60">Verifying your email...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center space-y-4 px-6">
          <p className="text-[#EDEDED]/80">Verification error. Redirecting...</p>
        </div>
      </div>
    )
  }

  // Verified - show success message
  return (
    <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center">
      <div className="text-center space-y-4 px-6 max-w-md">
        <div className="text-4xl mb-4">✓</div>
        <h1 className="text-2xl font-black tracking-tight text-[#EDEDED]">
          Email Verified
        </h1>
        <p className="text-sm text-[#EDEDED]/60">
          Your email has been confirmed. Redirecting you now...
        </p>
      </div>
    </div>
  )
}

