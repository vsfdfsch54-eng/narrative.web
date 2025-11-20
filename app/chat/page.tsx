"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence } from "framer-motion"
import { ProfileCard, Profile } from "@/components/ui/profile-card"
import { BottomNav } from "@/components/ui/bottom-nav"
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
        // Load potential matches from database
        // For now, return empty array since there are no users yet
        const response = await fetch(`/api/matches?userId=${user.id}&type=potential`)
        const data = await response.json()
        if (data.success && data.data) {
          setProfiles(data.data)
        } else {
          setProfiles([])
        }
      } catch (error) {
        console.error('Error loading matches:', error)
        setProfiles([])
      } finally {
        setLoading(false)
      }
    }

    loadMatches()
  }, [user])

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
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0A0A0A]">
        <p className="text-[#E5E5E5]/60">Loading...</p>
      </div>
    )
  }

  if (profiles.length === 0) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] overflow-hidden w-full h-full m-0 p-0 sm:flex sm:items-center sm:justify-center sm:p-4 sm:p-6">
        {/* Phone Frame Container */}
        <div className="phone-frame-container">
          {/* Phone Frame - Black & White */}
          <div className="phone-frame">
            {/* Phone Screen */}
            <div className="phone-screen">
              <div className="phone-content flex flex-col items-center justify-center text-center px-6 py-6 gap-4 overflow-hidden">
                <h1 className="text-xl font-bold text-white">
                  Find Your Match
                </h1>
                <p className="text-sm text-[#E5E5E5]/60 max-w-xs">
                  No matches yet. Start by selecting a vibe and topic to find people to connect with!
                </p>
                <button
                  onClick={() => router.push("/vibe")}
                  className="px-5 py-2.5 rounded-full bg-[#E5E5E5] text-[#0A0A0A] font-semibold text-sm"
                >
                  Select Vibe & Topic
                </button>
              </div>
              <BottomNav />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!currentProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0A0A0A]">
        <div className="text-center">
          <p className="text-[#E5E5E5]/60 text-lg">No more profiles to show</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] overflow-hidden w-full h-full m-0 p-0 sm:flex sm:items-center sm:justify-center sm:p-4 sm:p-6">
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

            {/* Bottom Navigation */}
            <BottomNav />
          </div>
        </div>
      </div>
    </div>
  )
}
