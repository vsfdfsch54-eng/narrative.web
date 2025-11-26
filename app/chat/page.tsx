"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { ProfileCard, Profile } from "@/components/ui/profile-card"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/AppShell"
import { tokens } from "@/lib/design-tokens"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

export default function ChatPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  // Check onboarding status
  useEffect(() => {
    if (authLoading || !user) return
    
    const checkOnboarding = async () => {
      try {
        const response = await fetch(`/api/users?userId=${user.id}`)
        const data = await response.json()
        
        if (data.success && data.data) {
          const dbStep = data.data.onboarding_step
          if (dbStep !== 'complete' && !data.data.onboarding_completed) {
            router.replace(`/onboarding?step=${dbStep || 'email'}`)
            return
          }
        } else {
          // User not found, redirect to onboarding
          router.replace('/onboarding?step=email')
          return
        }
      } catch (error) {
        console.error('[ChatPage] Error checking onboarding:', error)
        router.replace('/onboarding?step=email')
        return
      }
    }
    
    checkOnboarding()
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user?.id) return

    const loadMatches = async () => {
      setLoading(true)
      try {
        // First, check if user has an active match
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
        
        // Check if user is in waiting pool (AI matching queue) with retry logic
        // This handles race conditions where the entry might not be immediately visible
        let waitingData = null
        let foundInQueue = false
        
        // Increase retries and wait time to handle slower database commits
        for (let attempt = 0; attempt < 5; attempt++) {
          const waitingResponse = await fetch(`/api/connect/status?userId=${user.id}`, { 
            method: 'GET',
            cache: 'no-store'
          })
          waitingData = await waitingResponse.json()
          
          
          if (waitingData.inQueue || waitingData.matched) {
            foundInQueue = true
            break // Found status, exit retry loop
          }
          
          // Wait longer before retrying (only if not found)
          if (attempt < 4) {
            await new Promise(resolve => setTimeout(resolve, 600)) // Increased from 400ms to 600ms
          }
        }
        
        if (waitingData?.inQueue) {
          // Already in AI matching queue, poll for match
          setLoading(false) // Stop loading, show waiting UI
          pollForMatch()
        } else if (waitingData?.matched && waitingData?.match) {
          // Already matched! Navigate immediately
          const otherUserId = waitingData.otherUserId
          router.push(`/chat/${otherUserId}?matchId=${waitingData.match.id}`)
        } else {
          // Not in queue after retries - check for existing matches first
          
          // Check for existing active matches first
          const matchesResponse = await fetch(`/api/matches?userId=${user.id}`, {
            cache: 'no-store'
          })
          
          if (matchesResponse.ok) {
            const matchesData = await matchesResponse.json()
            if (matchesData.success && matchesData.data && matchesData.data.length > 0) {
              const matches = Array.isArray(matchesData.data) ? matchesData.data : [matchesData.data]
              const activeMatches = matches.filter((m: any) => m.status === 'active')
              if (activeMatches.length > 0) {
                const randomMatch = activeMatches[Math.floor(Math.random() * activeMatches.length)]
                const otherUserId = randomMatch.user1_id === user.id ? randomMatch.user2_id : randomMatch.user1_id
                setLoading(false)
                router.push(`/chat/${otherUserId}?matchId=${randomMatch.id}`)
                return
              }
            }
          }
          
          // No matches found - check if user exists in database
          const userCheckResponse = await fetch(`/api/users?userId=${user.id}`)
          const userCheckData = await userCheckResponse.json()
          
          if (!userCheckData.success || !userCheckData.data) {
            // User doesn't exist in database, redirect to onboarding
            router.push('/onboarding')
            return
          }
          
          // User exists but not in queue - show empty state instead of redirecting
          // This prevents redirect loops
          setLoading(false)
          // Don't redirect - just show empty state so user can try connecting again
        }
      } catch (error) {
        console.error('Error loading matches:', error)
        setProfiles([])
        setLoading(false)
      }
    }

    const pollForMatch = async () => {
      let pollCount = 0
      const maxPolls = 240 // 2 minutes at 0.5s intervals
      
      // Subscribe to realtime changes on waiting_pool for this user
      const channel = supabase
        .channel(`waiting_pool_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'waiting_pool',
            filter: `user_id=eq.${user.id}`,
          },
          async (payload: any) => {
            // User was removed from waiting pool - likely matched!
            // Check for new chat match
            const { data: matches, error } = await supabase
              .from('chat_matches')
              .select('*')
              .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
              .eq('status', 'active')
              .order('created_at', { ascending: false })
              .limit(1)
              .single()

            if (!error && matches) {
              const otherUserId = matches.user1_id === user.id ? matches.user2_id : matches.user1_id
              router.push(`/chat/${otherUserId}?matchId=${matches.id}`)
            }
          }
        )
        .subscribe()

      // Poll every 500ms to check for matches (GET endpoint now runs AI matching)
      const interval = setInterval(async () => {
        pollCount++
        try {
          // Stop polling after max attempts
          if (pollCount > maxPolls) {
            clearInterval(interval)
            channel.unsubscribe()
            setLoading(false)
            return
          }
          
          // Every 2 polls (1 second), trigger AI matchmaking directly as backup (more aggressive)
          if (pollCount % 2 === 0) {
            fetch('/api/matchmaking/process', { 
              method: 'GET',
              cache: 'no-store'
            }).catch(() => {
              // Silently fail
            })
          }
          
          // Check if user was matched (status endpoint runs AI matching automatically)
          const response = await fetch(`/api/connect/status?userId=${user.id}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            }
          })
          
          if (!response.ok) {
            // Don't throw, just continue polling
            return
          }
          
          const data = await response.json()
          
          if (data.success && data.matched && data.match && data.otherUserId) {
            // AI match found! Navigate immediately
            clearInterval(interval)
            channel.unsubscribe()
            setLoading(false)
            router.push(`/chat/${data.otherUserId}?matchId=${data.match.id}`)
            return
          }
          
          if (!data.inQueue) {
            // No longer in queue - check for existing matches
            clearInterval(interval)
            channel.unsubscribe()
            
            const matchesResponse = await fetch(`/api/matches?userId=${user.id}`, {
              cache: 'no-store'
            })
            if (matchesResponse.ok) {
              const matchesData = await matchesResponse.json()
              if (matchesData.success && matchesData.data && matchesData.data.length > 0) {
                const matches = Array.isArray(matchesData.data) ? matchesData.data : [matchesData.data]
                const activeMatches = matches.filter((m: any) => m.status === 'active')
                if (activeMatches.length > 0) {
                  const randomMatch = activeMatches[Math.floor(Math.random() * activeMatches.length)]
                  const otherUserId = randomMatch.user1_id === user.id ? randomMatch.user2_id : randomMatch.user1_id
                  setLoading(false)
                  router.push(`/chat/${otherUserId}?matchId=${randomMatch.id}`)
                  return
                }
              }
            }
            setLoading(false)
          }
        } catch (error) {
          // Don't stop polling on error
        }
      }, 500) // Poll every 500ms - GET endpoint runs AI matching automatically

      // Cleanup after 2 minutes
      const timeout = setTimeout(() => {
        clearInterval(interval)
        channel.unsubscribe()
        setLoading(false)
      }, 120000)

      // Return cleanup function
      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
        channel.unsubscribe()
      }
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
      <AppShell>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: tokens.spacing[20],
        }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{
              width: '32px',
              height: '32px',
              color: tokens.colors.textSecondary,
            }}
          >
            <Loader2 size={32} />
          </motion.div>
          <p style={{
            ...tokens.typography.body,
            color: tokens.colors.textSecondary,
          }}>
            Loading...
          </p>
        </div>
      </AppShell>
    )
  }

  if (profiles.length === 0 && !loading) {
    return (
      <AppShell>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: tokens.spacing[28],
          paddingTop: tokens.layout.topTitleSpacing,
          textAlign: 'center',
        }}>
          {/* Animated dots - matching app design */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: tokens.spacing[10],
          }}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: tokens.colors.pillUnselected,
                  boxShadow: tokens.shadows.pillUnselected,
                }}
              />
            ))}
          </div>

          {/* Title - matching app typography */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: tokens.spacing[12],
            maxWidth: tokens.layout.maxWidth,
          }}>
            <h1 style={{
              ...tokens.typography.title,
              color: tokens.colors.textPrimaryOnDark,
              margin: 0,
            }}>
              AI is Finding Your Match
            </h1>
            <p style={{
              ...tokens.typography.body,
              color: tokens.colors.textSecondary,
              margin: 0,
              maxWidth: '90%',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              Our AI is analyzing personalities to find your perfect conversation partner. This should only take a moment...
            </p>
          </div>

          {/* Go Back Button - matching app pill design */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/vibe")}
            style={{
              padding: `12px ${tokens.spacing[20]}`,
              borderRadius: tokens.radii.button,
              background: tokens.colors.pillUnselected,
              border: 'none',
              color: tokens.colors.textOnPill,
              boxShadow: tokens.shadows.pillUnselected,
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              marginTop: tokens.spacing[8],
            }}
          >
            Go Back
          </motion.button>
        </div>
      </AppShell>
    )
  }

  if (!currentProfile) {
    return (
      <AppShell>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: tokens.spacing[20],
        }}>
          <p style={{
            ...tokens.typography.body,
            color: tokens.colors.textSecondary,
          }}>
            No more profiles to show
          </p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.layout.sectionSpacing,
        paddingTop: tokens.layout.topTitleSpacing,
        paddingBottom: '120px',
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: tokens.spacing[8],
        }}>
          <h1 style={{
            ...tokens.typography.title,
            color: tokens.colors.textPrimaryOnDark,
            margin: 0,
          }}>
            Find Your Match
          </h1>
        </div>

        {/* Profile Card Container */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: tokens.spacing[20],
        }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentProfile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              style={{
                width: '100%',
                maxWidth: tokens.layout.maxWidth,
              }}
            >
              <ProfileCard
                profile={currentProfile}
                onChat={() => {
                  router.push(`/chat/${currentProfile.id}`)
                }}
                onSkip={handleSkip}
              />
            </motion.div>
          </AnimatePresence>

          {/* Progress Indicator */}
          {profiles.length > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: tokens.spacing[8],
              marginTop: tokens.spacing[12],
            }}>
              {profiles.map((_, index) => (
                <motion.div
                  key={index}
                  animate={{
                    width: index === currentIndex ? '24px' : '4px',
                    opacity: index === currentIndex ? 1 : 0.3,
                  }}
                  transition={{ duration: 0.2 }}
                  style={{
                    height: '4px',
                    borderRadius: '2px',
                    background: tokens.colors.pillUnselected,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
