"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { signIn, user, loading: authLoading } = useAuth()

  // Redirect if user is already authenticated and verified
  useEffect(() => {
    if (!authLoading && user && user.email_confirmed_at) {
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
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn(email, password)
      if (result.success) {
        // Check if user needs onboarding
        if ((result as any).needsOnboarding) {
          router.push("/onboarding")
        } else {
          // Check onboarding status
          const checkOnboarding = async () => {
            try {
              const response = await fetch(`/api/users?userId=${(result as any).data.user.id}`)
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
      <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-[#E5E5E5]/60">Loading...</p>
      </div>
    )
  }

  // If user is authenticated, show loading while redirecting
  if (user && user.email_confirmed_at) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-[#E5E5E5]/60">Loading...</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] overflow-hidden w-full h-full m-0 p-0">
      <div className="phone-frame-container">
        <div className="phone-frame">
          <div className="phone-screen">
            <div className="phone-content p-4 gap-4 overflow-hidden flex flex-col">
              <div className="text-center space-y-1.5 flex-shrink-0">
                <h1 className="text-2xl font-black tracking-tight text-[#E5E5E5]">
                  Welcome back
                </h1>
                <p className="text-xs text-[#E5E5E5]/60">
                  Sign in to continue the conversation
                </p>
              </div>

              <Card className="p-4 glass-effect border-[#E5E5E5]/10 bg-[#1A1A1A]/30 shadow-2xl flex-shrink-0">
                <CardContent className="p-0">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 rounded-2xl border border-[#E5E5E5]/15 bg-[#E5E5E5]/5 text-xs text-[#E5E5E5]/80">
                        {error}
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] uppercase tracking-[0.2em] text-[#E5E5E5]/60">
                          Email
                        </label>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={loading}
                          className="bg-[#1A1A1A]/40 border-[#E5E5E5]/10 text-sm h-12 text-[#E5E5E5]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] uppercase tracking-[0.2em] text-[#E5E5E5]/60">
                          Password
                        </label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={loading}
                          className="bg-[#1A1A1A]/40 border-[#E5E5E5]/10 text-sm h-12 text-[#E5E5E5]"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button
                        type="submit"
                        variant="primary"
                        className="w-full h-12 text-sm font-semibold tracking-wide bg-[#E5E5E5] text-[#0A0A0A] border border-[#E5E5E5]/70 shadow-[0_12px_35px_rgba(0,0,0,0.45)]"
                        size="lg"
                        disabled={loading}
                      >
                        {loading ? "Signing in..." : "Sign In"}
                      </Button>

                      <div className="text-center text-[11px] text-[#E5E5E5]/60">
                        Don&apos;t have an account?{" "}
                        <Link href="/onboarding" className="text-[#E5E5E5] underline-offset-4 hover:underline">
                          Create account
                        </Link>
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
