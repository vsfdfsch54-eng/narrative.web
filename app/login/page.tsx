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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[375px] mx-auto"
      >
        <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-2 border border-slate-700/50 shadow-2xl">
          <div className="bg-slate-950 rounded-[2rem] border border-slate-800/50 flex flex-col h-[600px] sm:h-[800px] overflow-hidden">
            <div className="flex flex-col flex-1 overflow-y-auto scrollbar-hide min-h-0 p-5 gap-5">
              <div className="text-center space-y-2 mt-2">
                <motion.h1
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="text-2xl font-black tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-clip-text text-transparent"
                >
                  Welcome back
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="text-xs text-slate-400/80"
                >
                  Sign in to continue the conversation
                </motion.p>
        </div>

              <Card className="p-4 glass-effect border-slate-700/30 bg-slate-900/30 shadow-2xl">
                <CardContent className="p-0">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 rounded-2xl border border-white/15 bg-white/5 text-xs text-white/80">
                        {error}
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="space-y-1.5">
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
                          className="bg-slate-900/40 border-slate-700/40 text-sm"
              />
            </div>
                      <div className="space-y-1.5">
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
                          className="bg-slate-900/40 border-slate-700/40 text-sm"
              />
            </div>
          </div>

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full h-11 text-sm font-semibold tracking-wide bg-white text-slate-900 border border-white/70 shadow-[0_12px_35px_rgba(0,0,0,0.45)]"
                      size="lg"
                      disabled={loading}
                    >
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>

                    <div className="text-center text-[11px] text-white/60">
                      Don&apos;t have an account?{" "}
                      <Link href="/signup" className="text-white underline-offset-4 hover:underline">
                        Sign up
                      </Link>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
