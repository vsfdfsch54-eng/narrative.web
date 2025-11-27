"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/AppShell"
import { tokens } from "@/lib/design-tokens"
import { checkOnboardingStatus } from "@/lib/user-helpers"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { Loader2 } from "lucide-react"

export default function InvitePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)
  const [offlineFriends, setOfflineFriends] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      router.replace("/")
      return
    }
    
    async function checkAndRedirect() {
      if (!user) return
      
      setCheckingOnboarding(true)
      
      try {
        const { completed, step, apiError } = await checkOnboardingStatus(user.id)
        
        if (apiError) {
          console.warn('[InvitePage] ⚠️ API error checking onboarding - redirecting to /match')
          router.replace("/match")
          return
        }

        if (!completed) {
          const redirectPath = `/onboarding?step=${step}`
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
          if (currentPath === redirectPath) {
            console.warn('[InvitePage] ⚠️ Already on target path, skipping redirect')
            return
          }
          router.replace(redirectPath)
          return
        }

        setCheckingOnboarding(false)
      } catch (error) {
        console.error('[InvitePage] Error checking onboarding:', error)
        router.replace("/match")
      } finally {
        setCheckingOnboarding(false)
      }
    }
    
    checkAndRedirect()
  }, [authLoading, user, router])

  // Load offline friends
  useEffect(() => {
    if (!user?.id || checkingOnboarding) return

    async function loadOfflineFriends() {
      if (!user) return
      
      try {
        setLoading(true)
        const response = await fetch(`/api/friends/offline?userId=${user.id}`, {
          method: 'GET',
          cache: 'no-store',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setOfflineFriends(data.friends || [])
          }
        }
      } catch (error) {
        console.error('[InvitePage] Error loading offline friends:', error)
        setOfflineFriends([])
      } finally {
        setLoading(false)
      }
    }

    loadOfflineFriends()
    const interval = setInterval(loadOfflineFriends, 30000)
    return () => clearInterval(interval)
  }, [user, checkingOnboarding])

  const handleInvite = async (friendId: string) => {
    // TODO: Implement invite notification logic
    console.log('Invite friend:', friendId)
    alert('Invite sent! (Stub for now)')
  }

  if (authLoading || checkingOnboarding) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0c] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#f1f1f3]/60" />
      </div>
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
        paddingBottom: '120px',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacing[12],
          marginBottom: tokens.spacing[28],
        }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            style={{
              padding: tokens.spacing[8],
              borderRadius: tokens.radii.button,
              background: 'transparent',
              border: 'none',
              color: tokens.colors.textPrimaryOnDark,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft style={{ width: '20px', height: '20px' }} />
          </motion.button>
          <h1 style={{
            ...tokens.typography.title,
            color: tokens.colors.textPrimaryOnDark,
            margin: 0,
          }}>
            Invite Friends
          </h1>
        </div>

        {/* Offline Friends List */}
        {loading ? (
          <p style={{
            color: tokens.colors.textSecondary,
            textAlign: 'center',
            padding: tokens.spacing[32],
          }}>
            Loading...
          </p>
        ) : offlineFriends.length > 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: tokens.spacing[12],
          }}>
            {offlineFriends.map((friend) => (
              <motion.div
                key={friend.id}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: tokens.spacing[16],
                  borderRadius: tokens.radii.button,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.10)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: tokens.spacing[12],
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.10)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                  }}>
                    <span>{friend.avatar || '👤'}</span>
                  </div>
                  <div>
                    <p style={{
                      ...tokens.typography.body,
                      color: tokens.colors.textPrimaryOnDark,
                      margin: 0,
                      fontWeight: 500,
                    }}>
                      {friend.name || 'User'}
                    </p>
                    <p style={{
                      ...tokens.typography.label,
                      color: tokens.colors.textSecondary,
                      margin: 0,
                      marginTop: tokens.spacing[4],
                    }}>
                      Offline
                    </p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleInvite(friend.id)}
                  style={{
                    padding: `${tokens.spacing[10]} ${tokens.spacing[16]}`,
                    borderRadius: tokens.radii.button,
                    background: tokens.colors.pillSelected,
                    border: 'none',
                    color: tokens.colors.textOnPill,
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Invite to chat
                </motion.button>
              </motion.div>
            ))}
          </div>
        ) : (
          <p style={{
            color: tokens.colors.textSecondary,
            textAlign: 'center',
            padding: tokens.spacing[32],
          }}>
            No offline friends to invite
          </p>
        )}
      </div>
    </AppShell>
  )
}

