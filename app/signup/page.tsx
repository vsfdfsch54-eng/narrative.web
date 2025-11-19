"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"

export default function SignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signUp(email, password, name)
      if (result.success) {
        router.push("/onboarding")
      } else {
        setError(result.error || "Failed to create account")
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[375px] mx-auto"
      >
        <div className="relative bg-[#0A0A0A] rounded-[24px] p-1 border border-white/10">
          <div className="bg-black rounded-[22px] border border-white/10 flex flex-col h-[600px] sm:h-[800px] overflow-hidden">
            <div className="flex flex-col flex-1 overflow-y-auto scrollbar-hide min-h-0 p-5 gap-5">
              <div className="text-center space-y-2 mt-2">
                <motion.h1
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="text-2xl font-black tracking-tight text-white"
                >
                  Create account
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="text-xs text-white/60"
                >
                  Join Narrative to start connecting
                </motion.p>
              </div>

              <Card className="p-4 bg-white/5 border-white/10">
                <CardContent className="p-0">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 rounded-2xl border border-white/15 bg-white/5 text-xs text-white/80">
                        {error}
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                          Name
                        </label>
                        <Input
                          type="text"
                          placeholder="Your name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          disabled={loading}
                          className="bg-white/5 border-white/10 text-sm text-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                          Email
                        </label>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={loading}
                          className="bg-white/5 border-white/10 text-sm text-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                          Password
                        </label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          disabled={loading}
                          className="bg-white/5 border-white/10 text-sm text-white"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full h-11 text-sm font-semibold tracking-wide bg-white text-black border border-white"
                      size="lg"
                      disabled={loading}
                    >
                      {loading ? "Creating account..." : "Sign Up"}
                    </Button>

                    <div className="text-center text-[11px] text-white/60">
                      Already have an account?{" "}
                      <Link href="/login" className="text-white underline-offset-4 hover:underline">
                        Sign in
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

