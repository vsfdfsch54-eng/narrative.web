"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] w-full h-full overflow-hidden">
        <div className="w-full h-full flex items-center justify-center px-6 py-8">
          <div className="flex flex-col items-center gap-8 w-full max-w-md text-center">
            <div className="text-4xl mb-4">✓</div>
            <h1 className="text-2xl font-black tracking-tight text-[#EDEDED]">
              Check Your Email
            </h1>
            <p className="text-sm text-[#EDEDED]/60 max-w-sm mx-auto">
              We sent a password reset link to {email}
            </p>
            <Link href="/login" className="text-xs text-[#EDEDED]/60 hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] w-full h-full overflow-hidden">
      <div className="w-full h-full flex items-center justify-center px-6 py-8">
        <div className="flex flex-col items-center gap-8 w-full max-w-md">
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-black tracking-tight text-[#EDEDED]">
              Reset Password
            </h1>
            <p className="text-sm text-[#EDEDED]/60 max-w-sm mx-auto">
              Enter your email and we&apos;ll send you a reset link
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {error && (
              <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.2em] text-[#EDEDED]/60">
                Email
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="bg-[#1A1A1A]/40 border-[#EDEDED]/10 text-sm h-12 text-[#EDEDED]"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-12 text-sm font-semibold tracking-wide bg-[#EDEDED] text-[#0A0A0A] border border-[#EDEDED]"
              size="lg"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>

            <Link href="/login" className="block text-center text-xs text-[#EDEDED]/60 hover:underline">
              Back to Login
            </Link>
          </form>
        </div>
      </div>
    </div>
  )
}

