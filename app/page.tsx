"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { PhoneFrame } from "@/components/layout/phone-frame"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Redirect to vibe page if already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.push("/vibe")
    }
  }, [user, loading, router])
  return (
    <PhoneFrame>
      <div className="phone-content flex items-center justify-center text-center px-6 py-10 gap-6">
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="text-[11px] uppercase tracking-[0.4em] text-slate-400"
              >
                Human-first social
              </motion.span>

              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="text-4xl font-black tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-clip-text text-transparent leading-tight"
              >
          Narrative
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="text-sm text-slate-400/90 max-w-xs"
              >
                A phone-native space to match through vibes, share topics, and keep your closest circle alive.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col gap-3 w-full"
              >
                <Button
                  asChild
                  variant="primary"
                  size="lg"
                  className="w-full h-12 text-sm font-semibold tracking-wide bg-white text-slate-900 border border-white/70 shadow-[0_15px_45px_rgba(0,0,0,0.45)] hover:-translate-y-0.5 transition-all"
                >
                  <Link href="/login">Get Started</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full h-12 text-sm font-semibold tracking-wide border-white/20 text-white hover:border-white/40 hover:bg-white/5"
          >
                  <Link href="/vibe">See the Flow</Link>
                </Button>
              </motion.div>
      </div>
    </PhoneFrame>
  )
}
