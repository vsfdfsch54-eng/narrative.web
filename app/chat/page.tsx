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
          console.log('[ChatPage] User is in queue, starting polling...')
          setLoading(false) // Stop loading, show waiting UI
          pollForMatch()
        } else {
          // Not in queue, show empty state
          console.log('[ChatPage] User not in queue, showing empty state')
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
      
      // Subscribe to realtime changes on pending_matches for this user
      const channel = supabase
        .channel(`pending_match_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'pending_matches',
            filter: `user_id=eq.${user.id}`,
          },
          async (payload: any) => {
            const pendingMatch = payload?.new
            if (pendingMatch?.status === 'matched') {
              // User was matched! Find the chat match
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
          }
        )
        .subscribe()

      // Poll every 500ms to check for matches (GET endpoint now runs matchmaking)
      let pollCount = 0
      const maxPolls = 240 // 2 minutes max (240 * 500ms = 120s)
      
      const interval = setInterval(async () => {
        pollCount++
        try {
          // Stop polling after max attempts
          if (pollCount > maxPolls) {
            console.log(`[ChatPage] Max polls reached (${maxPolls}), stopping...`)
            clearInterval(interval)
            channel.unsubscribe()
            setLoading(false)
            return
          }
          
          console.log(`[ChatPage] Polling for match (attempt ${pollCount}/${maxPolls}) for user ${user.id}`)
          
          // Every 5 polls (2.5 seconds), trigger matchmaking directly as backup
          if (pollCount % 5 === 0) {
            console.log(`[ChatPage] Triggering direct matchmaking as backup (poll ${pollCount})`)
            fetch('/api/matchmaking/process', { 
              method: 'GET',
              cache: 'no-store'
            }).then(r => r.json()).then(data => {
              if (data.matched > 0) {
                console.log(`[ChatPage] ✅ Backup matchmaking matched ${data.matched} pair(s)`)
              }
            }).catch(err => console.error('[ChatPage] Error triggering matchmaking:', err))
          }
          
          // Check if user was matched (GET endpoint runs matchmaking automatically)
          const response = await fetch(`/api/pending-matches?userId=${user.id}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            }
          })
          
          if (!response.ok) {
            console.error(`[ChatPage] HTTP error! status: ${response.status}`)
            // Don't throw, just log and continue polling
            return
          }
          
          const data = await response.json()
          console.log(`[ChatPage] Poll response:`, { 
            success: data.success, 
            matched: data.matched, 
            inQueue: data.inQueue,
            hasMatch: !!data.match,
            hasOtherUserId: !!data.otherUserId
          })
          
          if (data.success && data.matched && data.match && data.otherUserId) {
            // Match found! Navigate immediately
            console.log(`[ChatPage] ✅ Match found! Navigating to chat with ${data.otherUserId}`)
            clearInterval(interval)
            channel.unsubscribe()
            setLoading(false)
            router.push(`/chat/${data.otherUserId}?matchId=${data.match.id}`)
            return
          }
          
          if (!data.inQueue) {
            console.log(`[ChatPage] User no longer in queue, checking for existing matches...`)
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
                  console.log(`[ChatPage] Found existing match, navigating to ${otherUserId}`)
                  setLoading(false)
                  router.push(`/chat/${otherUserId}?matchId=${randomMatch.id}`)
                  return
                }
              }
            }
            console.log(`[ChatPage] No matches found, stopping polling`)
            setLoading(false)
          } else {
            // Still in queue - keep polling but don't log every time to reduce noise
            if (pollCount % 10 === 0) {
              console.log(`[ChatPage] Still in queue (${pollCount} polls)...`)
            }
          }
        } catch (error) {
          console.error('[ChatPage] Error polling for match:', error)
          // Don't stop polling on error, just log it
        }
      }, 500) // Poll every 500ms - GET endpoint runs matchmaking automatically

      // Cleanup after 2 minutes
      const timeout = setTimeout(() => {
        console.log(`[ChatPage] Timeout reached, stopping polling`)
        clearInterval(interval)
        channel.unsubscribe()
        setLoading(false)
      }, 120000)

      // Return cleanup function
      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
        channel.unsubscribe()
        setLoading(false)
      }

      // Return cleanup function
      return () => {
        clearInterval(interval)
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
              Finding Your Match
            </h1>
            <p style={{
              ...tokens.typography.body,
              color: tokens.colors.textSecondary,
              margin: 0,
              maxWidth: '90%',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              We&apos;re connecting you with someone right now. This should only take a moment...
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
