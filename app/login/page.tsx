"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { AnimatedButton } from "@/components/ui/animated-button"
import { useAuth } from "@/hooks/use-auth"
import { tokens } from "@/lib/design-tokens"
import Link from "next/link"
import { checkOnboardingStatus } from "@/lib/user-helpers"
import { AppShell } from "@/components/AppShell"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { signIn, user, loading: authLoading } = useAuth()

  // Redirect if user is already authenticated
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return
    }

    // USER LOGGED OUT → Show login page
    if (!user) {
      return
    }

    // USER LOGGED IN → Check onboarding and redirect
    async function checkAndRedirect() {
      if (!user) return
      
      try {
        const { completed, step, apiError } = await checkOnboardingStatus(user.id)

        // NEVER redirect on API errors - causes redirect loops
        if (apiError) {
          console.warn('[LoginPage] ⚠️ API error checking onboarding - redirecting to /vibe to prevent loop')
          router.replace("/vibe")
          return
        }

        if (!completed) {
          // Incomplete onboarding → redirect to onboarding
          // Safety check: prevent redirect loops
          const redirectPath = `/onboarding?step=${step}`
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
          if (currentPath === redirectPath) {
            console.warn('[LoginPage] ⚠️ Already on target path, skipping redirect to prevent loop')
            return
          }
          router.replace(redirectPath)
          return
        }

        // Complete onboarding → redirect to /vibe
        router.replace("/vibe")
      } catch (error) {
        console.error('[LoginPage] Error checking onboarding:', error)
        // On error, redirect to /vibe (not onboarding) to prevent loops
        router.replace("/vibe")
      }
    }

    checkAndRedirect()
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn(email, password)
      if (result.success) {
        // After successful login, check onboarding step from DB
        // After successful login, check onboarding and redirect
        const userId = (result as any).data?.user?.id || user?.id
        if (!userId) {
          router.replace("/onboarding?step=email")
          return
        }

        try {
          const { completed, step, apiError } = await checkOnboardingStatus(userId)

          // NEVER redirect on API errors - causes redirect loops
          if (apiError) {
            console.warn('[LoginPage] ⚠️ API error after signin - redirecting to /vibe to prevent loop')
            router.replace("/vibe")
            return
          }

          if (!completed) {
            router.replace(`/onboarding?step=${step}`)
          } else {
            router.replace("/vibe")
          }
        } catch (err) {
          console.error('[LoginPage] Error checking onboarding after signin:', err)
          // On error, redirect to /vibe (not onboarding) to prevent loops
          router.replace("/vibe")
        }
      } else {
        setError(result.error || "Invalid credentials")
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <AppShell>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <p style={{ color: tokens.colors.textSecondary }}>Loading...</p>
      </div>
      </AppShell>
    )
  }

  // If user is authenticated, show loading while redirecting
  // (The useEffect above will handle the redirect)
  if (user && !authLoading) {
    return (
      <AppShell>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <p style={{ color: tokens.colors.textSecondary }}>Loading...</p>
        </div>
      </AppShell>
    )
  }

  const isValid = email.trim() !== '' && email.includes('@') && email.includes('.') && password.length > 0

  return (
    <AppShell>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 140px)',
        padding: `${tokens.spacing[20]} ${tokens.layout.paddingHorizontal}`,
        paddingBottom: tokens.spacing[32],
      }}>
        <div style={{
          width: '100%',
          maxWidth: tokens.layout.maxWidth,
          display: 'flex',
          flexDirection: 'column',
          gap: tokens.spacing[20],
        }}>
          <div>
            <h1 style={{
              ...tokens.typography.title,
              color: tokens.colors.textPrimaryOnDark,
              margin: 0,
              marginBottom: tokens.spacing[8],
              textAlign: 'center',
            }}>
                  Welcome back
                </h1>
            <p style={{
              ...tokens.typography.body,
              color: tokens.colors.textSecondary,
              margin: 0,
              textAlign: 'center',
            }}>
                  Sign in to continue the conversation
                </p>
              </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[16] }}>
                    {error && (
                      <div style={{
                        padding: tokens.spacing[12],
                        borderRadius: tokens.radii.input,
                        background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#FCA5A5',
                fontSize: '13px',
                textAlign: 'center',
                      }}>
                        {error}
                      </div>
                    )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[16] }}>
              <div>
                <label style={{
                  ...tokens.typography.label,
                  color: tokens.colors.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: tokens.spacing[8],
                  display: 'block',
                }}>
                          Email
                        </label>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={loading}
                  autoFocus
                        />
                      </div>

              <div>
                <label style={{
                  ...tokens.typography.label,
                  color: tokens.colors.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: tokens.spacing[8],
                  display: 'block',
                }}>
                          Password
                        </label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[12] }}>
              <AnimatedButton
                        type="submit"
                disabled={!isValid || loading}
                style={{ width: '100%' }}
                      >
                {loading ? 'Signing in...' : 'Sign In'}
              </AnimatedButton>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: tokens.spacing[8],
                textAlign: 'center',
              }}>
                <p style={{
                  ...tokens.typography.label,
                  color: tokens.colors.textSecondary,
                  margin: 0,
                }}>
                          Don&apos;t have an account?{" "}
                  <Link href="/onboarding" style={{ 
                    color: tokens.colors.textPrimaryOnDark, 
                    textDecoration: 'underline' 
                  }}>
                            Create account
                          </Link>
                </p>
                <Link 
                  href="/auth/reset-password" 
                  style={{ 
                    ...tokens.typography.label,
                    color: tokens.colors.textSecondary,
                    textDecoration: 'underline',
                  }}
                >
                            Forgot password?
                          </Link>
                      </div>
                    </div>
                  </form>
        </div>
      </div>
    </AppShell>
  )
}
