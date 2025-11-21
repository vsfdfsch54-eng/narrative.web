"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence } from "framer-motion"
import { ProfileCard, Profile } from "@/components/ui/profile-card"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

export default function ChatPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!user?.id) return

    const loadMatches = async () => {
      setLoading(true)
      try {
        // First, check if user has a pending match that was just matched
        const pendingResponse = await fetch(`/api/pending-matches?userId=${user.id}`)
        const pendingData = await pendingResponse.json()
        
        if (pendingData.success && pendingData.matched && pendingData.match) {
          // Matched! Navigate to chat immediately
          router.push(`/chat/${pendingData.otherUserId}?matchId=${pendingData.match.id}`)
          return
        }
        
        // Get all existing active matches for this user
        const response = await fetch(`/api/matches?userId=${user.id}`)
        const data = await response.json()
        
        if (data.success && data.data && data.data.length > 0) {
          // User has matches - randomly select one
          const matches = Array.isArray(data.data) ? data.data : [data.data]
          const activeMatches = matches.filter((m: any) => m.status === 'active')
          
          if (activeMatches.length > 0) {
            // Randomly select a match
            const randomMatch = activeMatches[Math.floor(Math.random() * activeMatches.length)]
            const otherUserId = randomMatch.user1_id === user.id ? randomMatch.user2_id : randomMatch.user1_id
            router.push(`/chat/${otherUserId}?matchId=${randomMatch.id}`)
            return
          }
        }
        
        // No matches found, check if in pending queue
        if (pendingData.inQueue) {
          // Already in queue, poll for match
          pollForMatch()
        } else {
          // Not in queue, show empty state
          setProfiles([])
          setLoading(false)
        }
      } catch (error) {
        console.error('Error loading matches:', error)
        setProfiles([])
        setLoading(false)
      }
    }

    const pollForMatch = async () => {
      // Poll every 1 second for instant matching
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/pending-matches?userId=${user.id}`)
          const data = await response.json()
          
          if (data.success && data.matched && data.match) {
            // Match found! Navigate immediately
            clearInterval(interval)
            router.push(`/chat/${data.otherUserId}?matchId=${data.match.id}`)
          } else if (!data.inQueue) {
            // No longer in queue
            clearInterval(interval)
            // Try to get existing matches
            const matchesResponse = await fetch(`/api/matches?userId=${user.id}`)
            const matchesData = await matchesResponse.json()
            if (matchesData.success && matchesData.data && matchesData.data.length > 0) {
              const matches = Array.isArray(matchesData.data) ? matchesData.data : [matchesData.data]
              const activeMatches = matches.filter((m: any) => m.status === 'active')
              if (activeMatches.length > 0) {
                const randomMatch = activeMatches[Math.floor(Math.random() * activeMatches.length)]
                const otherUserId = randomMatch.user1_id === user.id ? randomMatch.user2_id : randomMatch.user1_id
                router.push(`/chat/${otherUserId}?matchId=${randomMatch.id}`)
              }
            }
            setLoading(false)
          }
        } catch (error) {
          console.error('Error polling for match:', error)
        }
      }, 1000) // Poll every 1 second for instant matching

      // Cleanup after 2 minutes
      setTimeout(() => {
        clearInterval(interval)
        setLoading(false)
      }, 120000)
    }

    loadMatches()
  }, [user, router])

  const currentProfile = profiles[currentIndex]

  const handleSkip = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // Loop back to start
      setCurrentIndex(0)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0c]">
        <p className="text-[#f1f1f3]/60">Loading...</p>
      </div>
    )
  }

  if (profiles.length === 0 && !loading) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0c] overflow-hidden w-full h-full m-0 p-0">
        <div className="phone-frame-container">
          <div className="phone-frame">
            <div className="phone-screen">
              <div className="phone-content flex flex-col items-center justify-center text-center px-6 py-6 gap-4 overflow-hidden">
                <h1 className="text-xl font-bold text-[#f1f1f3]">
                  Waiting for Match
                </h1>
                <p className="text-sm text-[#f1f1f3]/60 max-w-xs">
                  We&apos;re finding someone for you to chat with. This should only take a moment...
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-[#f1f1f3]/60 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-[#f1f1f3]/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-[#f1f1f3]/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
                <button
                  onClick={() => router.push("/vibe")}
                  className="px-5 py-2.5 rounded-full bg-[#f1f1f3]/10 text-[#f1f1f3] border border-[#f1f1f3]/20 font-semibold text-sm hover:bg-[#f1f1f3]/20 mt-4"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!currentProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0c]">
        <div className="text-center">
          <p className="text-[#f1f1f3]/60 text-lg">No more profiles to show</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0c] overflow-hidden w-full h-full m-0 p-0 sm:flex sm:items-center sm:justify-center sm:p-4 sm:p-6">
      {/* Phone Frame Container */}
      <div className="phone-frame-container">
        {/* Phone Frame - Black & White */}
        <div className="phone-frame">
          {/* Phone Screen */}
          <div className="phone-screen">
            <div className="phone-content px-4 py-3 sm:p-4 pb-4 overflow-hidden flex flex-col h-full">
              {/* Header */}
              <div className="text-center mb-3 flex-shrink-0">
                <h1 className="text-xl sm:text-2xl font-bold tracking-[-0.02em] text-white leading-tight">
                  Find Your Match
                </h1>
              </div>

              {/* Profile Card Container - Single Card, Full Screen */}
              <div className="flex-1 flex items-center justify-center relative min-h-0 overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  <div
                    key={currentProfile.id}
                    className="w-full h-full flex items-center justify-center pointer-events-auto"
                  >
                    <ProfileCard
                      profile={currentProfile}
                      onChat={() => {
                        router.push(`/chat/${currentProfile.id}`)
                      }}
                      onSkip={handleSkip}
                    />
                  </div>
                </AnimatePresence>
              </div>

              {/* Progress Indicator */}
              <div className="flex justify-center gap-2 flex-shrink-0 mt-4">
                {profiles.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-1 rounded-full transition-all duration-200",
                      index === currentIndex ? "w-6 bg-white" : "w-1 bg-white/20"
                    )}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
