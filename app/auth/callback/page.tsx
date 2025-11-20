"use client"

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the code from URL hash or query params
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const code = hashParams.get('code') || searchParams.get('code')
        const next = searchParams.get('next') || '/onboarding?verified=true'

        if (code) {
          // Exchange the code for a session
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            console.error('Error exchanging code for session:', exchangeError)
            setError('Verification failed. Please try again.')
            setLoading(false)
            // Redirect to onboarding with error after a delay
            setTimeout(() => {
              router.push('/onboarding?error=verification_failed')
            }, 2000)
            return
          }

          if (data.session && data.user) {
            // Successfully verified and logged in
            // Check email verification status
            if (data.user.email_confirmed_at) {
              // Email is verified, redirect directly to /vibe
              router.push('/vibe')
            } else {
              // Email not verified yet, redirect to verify page
              router.push('/verify')
            }
          } else {
            setError('No session created. Please try again.')
            setLoading(false)
            setTimeout(() => {
              router.push('/onboarding?error=no_session')
            }, 2000)
          }
        } else {
          // No code, check if user is already authenticated
          const { data: { session } } = await supabase.auth.getSession()
          if (session && session.user) {
            // Check email verification
            if (session.user.email_confirmed_at) {
              // Email verified, redirect directly to /vibe
              router.push('/vibe')
            } else {
              // Email not verified, redirect to verify page
              router.push('/verify')
            }
          } else {
            // No code and no session, redirect to landing page
            router.push('/')
          }
        }
      } catch (err: any) {
        console.error('Auth callback error:', err)
        setError('An error occurred. Please try again.')
        setLoading(false)
        setTimeout(() => {
          router.push('/onboarding?error=callback_error')
        }, 2000)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-[#EDEDED]/60">Verifying your email...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center space-y-4 px-6">
          <p className="text-[#EDEDED]/80">{error}</p>
          <p className="text-[#EDEDED]/40 text-sm">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center">
      <div className="text-center space-y-4">
          <p className="text-[#EDEDED]/60">Processing...</p>
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-[#EDEDED]/60">Loading...</p>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}

