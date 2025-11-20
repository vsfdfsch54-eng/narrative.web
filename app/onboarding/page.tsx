"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"

export default function OnboardingPage() {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !user?.id) return

    setError("")
    setLoading(true)

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: name.trim()
        })
      })

      const data = await response.json()
      if (data.success) {
        router.push("/vibe")
      } else {
        setError(data.error || "Failed to save name")
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden sm:flex sm:items-center sm:justify-center sm:p-4 sm:p-6 w-screen h-screen">
      <div className="phone-frame-container">
        <div className="phone-frame">
          <div className="phone-screen">
            <div className="phone-content p-5 gap-5 items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="text-center space-y-4 w-full"
              >
                <h1 className="text-3xl font-black tracking-tight text-white">
                  Welcome to Narrative
                </h1>
                <p className="text-sm text-white/60">
                  Let&apos;s start by setting up your profile
                </p>
              </motion.div>

              <form onSubmit={handleSubmit} className="w-full space-y-4">
                {error && (
                  <div className="p-3 rounded-[16px] border border-white/15 bg-white/5 text-xs text-white/80">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                    Your Name
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                    className="bg-white/5 border-white/10 text-sm text-white"
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-11 text-sm font-semibold tracking-wide bg-white text-black border border-white"
                  size="lg"
                  disabled={loading || !name.trim()}
                >
                  {loading ? "Saving..." : "Continue"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

