"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/AppShell"
import { CardStack } from "@/components/match/CardStack"
import { tokens } from "@/lib/design-tokens"
import { checkOnboardingStatus } from "@/lib/user-helpers"
import { Loader2 } from "lucide-react"

export default function MatchPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
          // API error - allow access to prevent loops
          console.warn('[MatchPage] API error checking onboarding, allowing access')
          return
        }
        
        if (!completed) {
          router.replace("/onboarding?step=email")
          return
        }
      } catch (error) {
        console.error('[MatchPage] Error checking onboarding:', error)
        // Allow access on error to prevent loops
      }
    }

    checkOnboarding()
  }, [user, authLoading, router])

  // Load match feed
  useEffect(() => {
    if (!user || authLoading) return

    async function loadMatchFeed() {
      if (!user) return // Additional check for TypeScript
      
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
          setProfiles(data.profiles)
        } else {
          setProfiles([])
        }
      } catch (err) {
        console.error('[MatchPage] Error loading match feed:', err)
        setError('Failed to load matches. Please try again.')
        setProfiles([])
      } finally {
        setLoading(false)
      }
    }

    loadMatchFeed()
  }, [user, authLoading])

  if (authLoading || loading) {
    return (
      <AppShell>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
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

  return (
    <AppShell>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        padding: `${tokens.spacing[20]} ${tokens.layout.paddingHorizontal}`,
      }}>
        <h1 style={{
          ...tokens.typography.heading,
          color: tokens.colors.textPrimaryOnDark,
          marginBottom: tokens.spacing[20],
        }}>
          Find Your Match
        </h1>

        {error && (
          <div style={{
            padding: tokens.spacing[16],
            borderRadius: tokens.radii.card,
            background: 'rgba(255, 0, 0, 0.1)',
            border: '1px solid rgba(255, 0, 0, 0.3)',
            color: tokens.colors.textPrimaryOnDark,
            marginBottom: tokens.spacing[16],
          }}>
            {error}
          </div>
        )}

        {profiles.length === 0 && !loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            padding: tokens.spacing[32],
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: '48px',
              marginBottom: tokens.spacing[16],
            }}>
              😔
            </p>
            <h2 style={{
              ...tokens.typography.heading,
              color: tokens.colors.textPrimaryOnDark,
              marginBottom: tokens.spacing[8],
            }}>
              No More Matches
            </h2>
            <p style={{
              ...tokens.typography.body,
              color: tokens.colors.textSecondary,
              marginBottom: tokens.spacing[24],
            }}>
              Check back later for new people to connect with!
            </p>
          </div>
        ) : (
          <CardStack
            profiles={profiles}
            currentUserId={user.id}
            onConnect={async (targetId) => {
              try {
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
                }
              } catch (err) {
                console.error('[MatchPage] Error connecting:', err)
              }
            }}
            onSkip={async (targetId) => {
              try {
                await fetch('/api/match/skip', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userId: user.id,
                    targetId,
                  }),
                })
              } catch (err) {
                console.error('[MatchPage] Error skipping:', err)
              }
            }}
          />
        )}
      </div>
    </AppShell>
  )
}

