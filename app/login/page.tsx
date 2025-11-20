"use client"

import { useState } from "react"
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
  const { signIn } = useAuth()

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
          router.push("/vibe")
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

  return (
    <div className="fixed inset-0 bg-black overflow-hidden w-full h-full m-0 p-0 sm:flex sm:items-center sm:justify-center sm:p-4 sm:p-6">
      <div className="phone-frame-container">
        <div className="phone-frame">
          <div className="phone-screen">
            <div className="phone-content p-4 gap-4 overflow-hidden flex flex-col">
              <div className="text-center space-y-1.5 flex-shrink-0">
                <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-clip-text text-transparent">
                  Welcome back
                </h1>
                <p className="text-xs text-slate-400/80">
                  Sign in to continue the conversation
                </p>
              </div>

              <Card className="p-4 glass-effect border-slate-700/30 bg-slate-900/30 shadow-2xl flex-shrink-0">
                <CardContent className="p-0">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 rounded-2xl border border-white/15 bg-white/5 text-xs text-white/80">
                        {error}
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                          Email
                        </label>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={loading}
                          className="bg-slate-900/40 border-slate-700/40 text-sm h-12"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                          Password
                        </label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={loading}
                          className="bg-slate-900/40 border-slate-700/40 text-sm h-12"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button
                        type="submit"
                        variant="primary"
                        className="w-full h-12 text-sm font-semibold tracking-wide bg-white text-slate-900 border border-white/70 shadow-[0_12px_35px_rgba(0,0,0,0.45)]"
                        size="lg"
                        disabled={loading}
                      >
                        {loading ? "Signing in..." : "Sign In"}
                      </Button>

                      <div className="text-center text-[11px] text-white/60">
                        Don&apos;t have an account?{" "}
                        <Link href="/onboarding" className="text-white underline-offset-4 hover:underline">
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
