"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/AppShell"
import { tokens } from "@/lib/design-tokens"
import { checkV2UserStatus } from "@/lib/user-helpers-v2"
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
        const status = await checkV2UserStatus(user.id)
        
        if (status.needsOnboarding) {
          router.replace('/onboarding-v2')
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
    // For now, just show a simple alert
    alert('Invite sent! (Notification stub for now)')
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
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacing[12],
          marginBottom: tokens.spacing[20],
          flexShrink: 0,
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
            fontSize: '28px',
          }}>
            Invite Friends
          </h1>
        </div>

        {/* Offline Friends List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
        }} className="no-scrollbar">
          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: tokens.spacing[32],
            }}>
              <p style={{
                color: tokens.colors.textSecondary,
                fontSize: '14px',
              }}>
                Loading...
              </p>
            </div>
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
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.10)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: tokens.spacing[12],
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.10)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                    }}>
                      <span>{friend.avatar || '👤'}</span>
                    </div>
                    <div>
                      <p style={{
                        ...tokens.typography.body,
                        color: tokens.colors.textPrimaryOnDark,
                        margin: 0,
                        fontWeight: 500,
                        fontSize: '15px',
                      }}>
                        {friend.name || 'User'}
                      </p>
                      <p style={{
                        ...tokens.typography.label,
                        color: tokens.colors.textSecondary,
                        margin: 0,
                        marginTop: tokens.spacing[4],
                        fontSize: '12px',
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
                      borderRadius: '9999px',
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.10) 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      color: tokens.colors.textPrimaryOnDark,
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Invite to chat
                  </motion.button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: tokens.spacing[32],
              textAlign: 'center',
            }}>
              <p style={{
                fontSize: '48px',
                marginBottom: tokens.spacing[16],
              }}>
                📭
              </p>
              <p style={{
                color: tokens.colors.textSecondary,
                fontSize: '14px',
              }}>
                No offline friends to invite
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
