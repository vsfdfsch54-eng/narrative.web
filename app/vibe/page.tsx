"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

export default function VibePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  
  // Redirect to topic-match page (replacement for vibe page)
  useEffect(() => {
    if (loading) {
      return
    }

    if (!user) {
      router.replace("/")
      return
    }

    // Redirect to topic-match page
    router.replace("/topic-match")
  }, [user, loading, router])

  // Show loading while redirecting
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
    }}>
      <Loader2 style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite' }} />
    </div>
  )
}
