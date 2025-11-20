"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ProfileCard, Profile } from "@/components/ui/profile-card"
import { BottomNav } from "@/components/ui/bottom-nav"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

export default function ConnectPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  // Get user ID from Supabase Auth
  const getUserId = () => {
    if (user?.id) return user.id
    return null
  }
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user?.id) return

    const loadMatches = async () => {
      setLoading(true)
      try {
        // Load potential matches from database
        // For now, return empty array since there are no users yet
        // In the future, this would query for compatible users
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <p className="text-white/60">Loading...</p>
      </div>
    )
  }

  if (profiles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-[375px] mx-auto"
        >
          <div className="relative bg-[#0A0A0A] rounded-[24px] p-1 border border-white/10">
            <div className="bg-black rounded-[22px] relative flex flex-col h-[600px] sm:h-[800px] overflow-hidden">
              <div className="phone-content p-4 pb-20 flex items-center justify-center">
                <h1 className="text-2xl font-bold text-white mb-4 text-center">
                  Find Your Match
                </h1>
                <p className="text-white/60 text-center mb-6 px-4">
                  No matches yet. Start by selecting a vibe and topic to find people to connect with!
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push("/vibe")}
                  className="px-6 py-3 rounded-full bg-white text-black font-semibold"
                >
                  Select Vibe & Topic
                </motion.button>
              </div>
              <BottomNav />
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!currentProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <div className="text-center">
          <p className="text-white/60 text-lg">No more profiles to show</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden sm:flex sm:items-center sm:justify-center sm:p-4 sm:p-6 w-screen h-screen m-0 p-0">
      {/* Phone Frame Container */}
      <div className="phone-frame-container">
        {/* Phone Frame - Black & White */}
        <div className="phone-frame">
          {/* Phone Screen */}

          <div className="phone-screen">
            <div className="phone-content p-4 pb-20">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center mb-6 flex-shrink-0"
              >
                <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-white leading-tight">
                  Find Your Match
                </h1>
              </motion.div>

              {/* Profile Card Container - Single Card, Full Screen */}
              <div className="flex-1 flex items-center justify-center relative min-h-0 mb-4">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={currentProfile.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-[320px] flex items-center justify-center pointer-events-auto"
                  >
                    <ProfileCard
                      profile={currentProfile}
                      onChat={async () => {
                        const userId = getUserId()
                        if (!userId) {
                          router.push("/login")
                          return
                        }
                        
                        const selectedTopic = localStorage.getItem("selectedTopic")
                        
                        try {
                          // Create match in database
                          const response = await fetch('/api/matches', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              user1Id: userId,
                              user2Id: currentProfile.id,
                              topic: selectedTopic || null,
                            })
                          })
                          
                          const data = await response.json()
                          if (data.success && data.data) {
                            // Store match ID for chat
                            localStorage.setItem(`match_${currentProfile.id}`, data.data.id)
                          }
                        } catch (error) {
                          console.error('Error creating match:', error)
                          // Still navigate even if match creation fails
                        }
                        
                        router.push(`/chat/${currentProfile.id}`)
                      }}
                      onSkip={handleSkip}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Progress Indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center gap-2 flex-shrink-0 mt-auto mb-2"
              >
                {profiles.map((_, index) => (
                  <motion.div
                    key={index}
                    layout
                    initial={false}
                    animate={{
                      width: index === currentIndex ? 24 : 4,
                    }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      "h-1 rounded-full",
                      index === currentIndex
                        ? "bg-white"
                        : "bg-white/20"
                    )}
                  />
                ))}
              </motion.div>
            </div>

            {/* Bottom Navigation */}
            <BottomNav />
          </div>
        </div>
      </div>
    </div>
  )
}
