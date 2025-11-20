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
    <div className="fixed inset-0 bg-black overflow-hidden w-full h-full m-0 p-0 sm:flex sm:items-center sm:justify-center sm:p-4 sm:p-6">
      <div className="phone-frame-container">
        <div className="phone-frame">
          <div className="phone-screen">
            <div className="phone-content p-4 gap-4 items-center justify-center overflow-hidden flex flex-col">
              <div className="text-center space-y-2 w-full flex-shrink-0">
                <h1 className="text-2xl font-black tracking-tight text-white">
                  Welcome to Narrative
                </h1>
                <p className="text-xs text-white/60">
                  Let&apos;s start by setting up your profile
                </p>
              </div>

              <form onSubmit={handleSubmit} className="w-full space-y-3 flex-shrink-0">
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

