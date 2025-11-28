"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/AppShell"
import { CardStack } from "@/components/match/CardStack"
import { tokens } from "@/lib/design-tokens"
import { checkOnboardingStatus } from "@/lib/user-helpers"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

export default function MatchPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const feedRef = useRef<any[]>([]) // Store full feed
  const onlineCountRef = useRef<number>(0) // Track online user count
  const currentCardUserIdRef = useRef<string | null>(null) // Track current card user
  const realtimeChannelRef = useRef<any>(null)

  // Routing guard: Check auth and onboarding status
  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.replace("/")
      return
    }

    async function checkOnboarding() {
      if (!user) return
      
      try {
        const { completed, apiError } = await checkOnboardingStatus(user.id)
        
        if (apiError) {
          console.warn('[MatchPage] API error checking onboarding, allowing access')
          return
        }
        
        if (!completed) {
          router.replace("/onboarding?step=email")
          return
        }
      } catch (error) {
        console.error('[MatchPage] Error checking onboarding:', error)
      }
    }

    checkOnboarding()
  }, [user, authLoading, router])

  // Load match feed ONCE when page loads
  const loadMatchFeed = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/match/feed?userId=${user.id}`, {
        method: 'GET',
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Failed to load match feed')
      }

      const data = await response.json()
      
      if (data.success && data.profiles) {
        const newProfiles = data.profiles
        feedRef.current = newProfiles
        setProfiles(newProfiles)
        onlineCountRef.current = newProfiles.length
        
        // Set current card user ID
        if (newProfiles.length > 0) {
          currentCardUserIdRef.current = newProfiles[0].id
        }
        
        setCurrentCardIndex(0)
      } else {
        feedRef.current = []
        setProfiles([])
        onlineCountRef.current = 0
        currentCardUserIdRef.current = null
      }
    } catch (err) {
      console.error('[MatchPage] Error loading match feed:', err)
      setError('Failed to load matches. Please try again.')
      feedRef.current = []
      setProfiles([])
    } finally {
      setLoading(false)
    }
  }

  // Initial feed load
  useEffect(() => {
    if (!user || authLoading) return
    loadMatchFeed()
  }, [user, authLoading])

  // Realtime presence listener
  useEffect(() => {
    if (!user?.id || loading) return

    // Subscribe to user_presence changes
    const channel = supabase
      .channel('match-presence-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `is_online=eq.true`,
        },
        async (payload: any) => {
          // Check if we need to refresh feed
          const oldRecord = payload.old_record as any
          const newRecord = payload.new_record as any
          const eventType = payload.eventType as string

          const shouldRefresh = 
            // Current card user went offline
            (oldRecord?.user_id === currentCardUserIdRef.current && 
             newRecord?.is_online === false) ||
            // Online count changed significantly (new user came online)
            (eventType === 'INSERT' && newRecord?.is_online === true)

          if (shouldRefresh) {
            console.log('[MatchPage] Presence change detected, refreshing feed...')
            await loadMatchFeed()
          }
        }
      )
      .subscribe()

    realtimeChannelRef.current = channel

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [user, loading])

  // Handle card actions (connect/skip)
  const handleCardAction = async (action: 'connect' | 'skip', targetId: string) => {
    if (!user?.id) return

    try {
      if (action === 'connect') {
        const response = await fetch('/api/match/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            targetId,
          }),
        })

        const data = await response.json()
        
        if (data.success && data.matched) {
          // Mutual match! Navigate to chat
          router.push(`/chat/${targetId}?roomId=${data.roomId}`)
          return
        }
      } else {
        // Skip - no API call needed for now
        await fetch('/api/match/skip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            targetId,
          }),
        })
      }

      // Move to next card (no feed refresh)
      const nextIndex = currentCardIndex + 1
      if (nextIndex < feedRef.current.length) {
        setCurrentCardIndex(nextIndex)
        currentCardUserIdRef.current = feedRef.current[nextIndex]?.id || null
      } else {
        // No more cards - refresh feed
        await loadMatchFeed()
      }
    } catch (err) {
      console.error('[MatchPage] Error in card action:', err)
    }
  }

  if (authLoading || loading) {
    return (
      <AppShell>
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: tokens.spacing[20],
        }}>
          <Loader2 style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite' }} />
          <p style={{
            marginTop: tokens.spacing[16],
            color: tokens.colors.textSecondary,
            fontSize: '16px',
          }}>
            Loading matches...
          </p>
        </div>
      </AppShell>
    )
  }

  if (!user) {
    return null
  }

  // Get current card from feed
  const currentCard = feedRef.current[currentCardIndex] || null
  const visibleProfiles = currentCard ? [currentCard] : []

  return (
    <AppShell>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        padding: `${tokens.spacing[20]} ${tokens.layout.paddingHorizontal}`,
        paddingTop: `${tokens.spacing[28]}`,
        paddingBottom: '100px',
      }}>
        {/* Header */}
        <div style={{
          flexShrink: 0,
          marginBottom: tokens.spacing[20],
          textAlign: 'center',
        }}>
          <h1 style={{
            ...tokens.typography.title,
            color: tokens.colors.textPrimaryOnDark,
            margin: 0,
            marginBottom: tokens.spacing[8],
            fontSize: '32px',
            fontWeight: 700,
          }}>
            Find Your Match
          </h1>
          <p style={{
            ...tokens.typography.body,
            color: tokens.colors.textSecondary,
            margin: 0,
            fontSize: '14px',
          }}>
            Swipe to discover new connections
          </p>
        </div>

        {error && (
          <div style={{
            flexShrink: 0,
            padding: tokens.spacing[12],
            borderRadius: tokens.radii.button,
            background: 'rgba(255, 0, 0, 0.1)',
            border: '1px solid rgba(255, 0, 0, 0.3)',
            color: tokens.colors.textPrimaryOnDark,
            marginBottom: tokens.spacing[16],
            textAlign: 'center',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        {/* Card Stack Container - Takes remaining space */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 0,
          overflow: 'hidden',
        }}>
          {visibleProfiles.length === 0 && !loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: tokens.spacing[32],
            }}>
              <p style={{
                fontSize: '64px',
                marginBottom: tokens.spacing[16],
              }}>
                😔
              </p>
              <h2 style={{
                ...tokens.typography.heading,
                color: tokens.colors.textPrimaryOnDark,
                marginBottom: tokens.spacing[8],
                fontSize: '24px',
              }}>
                No More Matches
              </h2>
              <p style={{
                ...tokens.typography.body,
                color: tokens.colors.textSecondary,
                marginBottom: tokens.spacing[20],
                fontSize: '14px',
              }}>
                Check back later for new people to connect with!
              </p>
            </div>
          ) : (
            <CardStack
              profiles={visibleProfiles}
              currentUserId={user.id}
              onConnect={async (targetId) => {
                await handleCardAction('connect', targetId)
              }}
              onSkip={async (targetId) => {
                await handleCardAction('skip', targetId)
              }}
            />
          )}
        </div>
      </div>
    </AppShell>
  )
}
