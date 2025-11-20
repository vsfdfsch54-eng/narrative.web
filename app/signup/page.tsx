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
    <div className="fixed inset-0 bg-black overflow-hidden w-full h-full m-0 p-0 sm:flex sm:items-center sm:justify-center sm:p-4 sm:p-6">
      <div className="phone-frame-container">
        <div className="phone-frame">
          <div className="phone-screen">
            <div className="phone-content p-4 gap-3 overflow-hidden flex flex-col">
              <div className="text-center space-y-1.5 flex-shrink-0">
                <h1 className="text-2xl font-black tracking-tight text-white">
                  Create account
                </h1>
                <p className="text-xs text-white/60">
                  Join Narrative to start connecting
                </p>
              </div>

              <Card className="p-3 bg-white/5 border-white/10 flex-1 min-h-0 flex flex-col">
                <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
                  <form onSubmit={handleSubmit} className="space-y-3 flex-1 min-h-0 flex flex-col">
                    {error && (
                      <div className="p-3 rounded-2xl border border-white/15 bg-white/5 text-xs text-white/80">
                        {error}
                      </div>
                    )}

                    <div className="space-y-2.5 flex-shrink-0">
                      <div className="space-y-1">
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
                      <div className="space-y-1">
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
                      <div className="space-y-1">
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

                    <div className="mt-auto space-y-2.5 flex-shrink-0">
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

