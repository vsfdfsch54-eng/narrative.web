"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { tokens } from "@/lib/design-tokens"
import Link from "next/link"
import { getOnboardingRouteForStep, normalizeOnboardingStep } from "@/lib/onboarding"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { signIn, user, loading: authLoading } = useAuth()

  // Redirect if user is already authenticated
  useEffect(() => {
    if (!authLoading && user && user.email_confirmed_at) {
      // Don't redirect if already on correct page
      if (typeof window !== 'undefined' && window.location.pathname === '/onboarding') {
        return
      }
      
      const checkOnboarding = async () => {
        try {
          // Fetch user from database - SINGLE SOURCE OF TRUTH
          const response = await fetch(`/api/users?userId=${user.id}`)
          const data = await response.json()
          
          if (data.success && data.data) {
            const dbStep = normalizeOnboardingStep(data.data.onboarding_step)
            
            // Redirect based on DB step
            if (dbStep === 'complete') {
              if (typeof window !== 'undefined' && window.location.pathname !== '/vibe') {
                router.push("/vibe")
              }
            } else {
              if (typeof window !== 'undefined' && window.location.pathname !== '/onboarding') {
                router.push(`/onboarding?step=${dbStep}`)
              }
            }
          } else {
            // Need onboarding
            if (typeof window !== 'undefined' && window.location.pathname !== '/onboarding') {
              router.push("/onboarding")
            }
          }
        } catch (err) {
          // Need onboarding
          if (typeof window !== 'undefined' && window.location.pathname !== '/onboarding') {
            router.push("/onboarding")
          }
        }
      }
      checkOnboarding()
    } else if (!authLoading && user && !user.email_confirmed_at) {
      // User is logged in but not verified
      if (typeof window !== 'undefined' && window.location.pathname !== '/verify') {
        router.push("/verify")
      }
    }
  }, [user, authLoading]) // Removed router from dependencies

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn(email, password)
      if (result.success) {
        // After successful login, check onboarding step from DB
        const checkOnboarding = async () => {
          try {
            const userId = (result as any).data?.user?.id || user?.id
            if (!userId) {
              if (typeof window !== 'undefined' && window.location.pathname !== '/onboarding') {
                router.push("/onboarding")
              }
              return
            }
            
            // Fetch user from database - SINGLE SOURCE OF TRUTH
            const response = await fetch(`/api/users?userId=${userId}`)
            const data = await response.json()
            
            if (data.success && data.data) {
              const dbStep = normalizeOnboardingStep(data.data.onboarding_step)
              
              // Redirect based on DB step
              if (dbStep === 'complete') {
                if (typeof window !== 'undefined' && window.location.pathname !== '/vibe') {
                  router.push("/vibe")
                }
              } else {
                if (typeof window !== 'undefined' && window.location.pathname !== '/onboarding') {
                  router.push(`/onboarding?step=${dbStep}`)
                }
              }
            } else {
              if (typeof window !== 'undefined' && window.location.pathname !== '/onboarding') {
                router.push("/onboarding")
              }
            }
          } catch (err) {
            if (typeof window !== 'undefined' && window.location.pathname !== '/onboarding') {
              router.push("/onboarding")
            }
          }
        }
        
        checkOnboarding()
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
      <div className="fixed inset-0 bg-[#0a0a0c] flex items-center justify-center">
        <p className="text-[#f1f1f3]/60">Loading...</p>
      </div>
    )
  }

  // If user is authenticated, show loading while redirecting
  if (user && user.email_confirmed_at) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0c] flex items-center justify-center">
        <p className="text-[#f1f1f3]/60">Loading...</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0c] overflow-hidden w-full h-full m-0 p-0">
      <div className="phone-frame-container">
        <div className="phone-frame">
          <div className="phone-screen">
            <div className="phone-content p-4 gap-4 overflow-hidden flex flex-col">
              <div className="text-center space-y-1.5 flex-shrink-0">
                <h1 className="text-2xl font-black tracking-tight text-[#f1f1f3]">
                  Welcome back
                </h1>
                <p className="text-xs text-[#f1f1f3]/60">
                  Sign in to continue the conversation
                </p>
              </div>

              <Card variant="surface1" className="p-4 flex-shrink-0">
                <CardContent className="p-0">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div style={{
                        padding: tokens.spacing[12],
                        borderRadius: tokens.radii.input,
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: 'none',
                        boxShadow: tokens.shadows.pillUnselected,
                        color: '#FCA5A5',
                        fontSize: '12px',
                      }}>
                        {error}
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] uppercase tracking-[0.2em] text-[#f1f1f3]/60">
                          Email
                        </label>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] uppercase tracking-[0.2em] text-[#f1f1f3]/60">
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

                    <div className="space-y-3">
                      <Button
                        type="submit"
                        variant="primary"
                        className="w-full h-12 text-sm font-semibold tracking-wide bg-[#f1f1f3] text-[#0a0a0c] border border-[#f1f1f3]/70 shadow-[0_12px_35px_rgba(0,0,0,0.45)]"
                        size="lg"
                        disabled={loading}
                      >
                        {loading ? "Signing in..." : "Sign In"}
                      </Button>

                      <div className="text-center text-[11px] text-[#f1f1f3]/60 space-y-2">
                        <div>
                          Don&apos;t have an account?{" "}
                          <Link href="/onboarding" className="text-[#f1f1f3] underline-offset-4 hover:underline">
                            Create account
                          </Link>
                        </div>
                        <div>
                          <Link href="/auth/reset-password" className="text-[#f1f1f3]/60 underline-offset-4 hover:underline">
                            Forgot password?
                          </Link>
                        </div>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
