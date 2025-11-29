"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { tokensV2 } from "@/lib/design-tokens-v2"
import { checkV2UserStatus } from "@/lib/user-helpers-v2"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { Loader2 } from "lucide-react"
import { NavbarV2 } from "@/components/ui/navbar-v2"

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
        router.replace("/home-v2")
      } finally {
        setCheckingOnboarding(false)
      }
    }
    
    checkAndRedirect()
  }, [authLoading, user, router])

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
    alert('Invite sent! (Notification stub for now)')
  }

  if (authLoading || checkingOnboarding) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: tokensV2.colors.backgroundEggshell,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Loader2 style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: tokensV2.colors.backgroundEggshell,
      paddingBottom: '80px',
    }}>
      <div style={{
        padding: tokensV2.spacing[24],
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: tokensV2.spacing[12],
          marginBottom: tokensV2.spacing[20],
        }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            style={{
              padding: tokensV2.spacing[8],
              borderRadius: tokensV2.borderRadius.medium,
              background: 'transparent',
              border: 'none',
              color: tokensV2.colors.textPrimary,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft style={{ width: '20px', height: '20px' }} />
          </motion.button>
          <h1 style={{
            fontSize: tokensV2.typography.fontSize['2xl'],
            fontWeight: tokensV2.typography.fontWeight.bold,
            color: tokensV2.colors.textPrimary,
            margin: 0,
          }}>
            Invite Friends
          </h1>
        </div>

        {/* Offline Friends List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: tokensV2.spacing[12],
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: tokensV2.spacing[32],
            }}>
              <p style={{
                color: tokensV2.colors.textSecondary,
                fontSize: tokensV2.typography.fontSize.sm,
              }}>
                Loading...
              </p>
            </div>
          ) : offlineFriends.length > 0 ? (
            offlineFriends.map((friend) => (
              <motion.div
                key={friend.id}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: tokensV2.spacing[16],
                  borderRadius: tokensV2.borderRadius.medium,
                  background: tokensV2.colors.backgroundWhite,
                  border: `1px solid ${tokensV2.colors.borderLight}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: tokensV2.spacing[12],
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: tokensV2.colors.backgroundWhite,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}>
                    <span>{friend.avatar || '👤'}</span>
                  </div>
                  <div>
                    <p style={{
                      fontSize: tokensV2.typography.fontSize.base,
                      color: tokensV2.colors.textPrimary,
                      margin: 0,
                      fontWeight: tokensV2.typography.fontWeight.semibold,
                    }}>
                      {friend.name || 'User'}
                    </p>
                    <p style={{
                      fontSize: tokensV2.typography.fontSize.sm,
                      color: tokensV2.colors.textSecondary,
                      margin: 0,
                      marginTop: tokensV2.spacing[4],
                    }}>
                      Offline
                    </p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleInvite(friend.id)}
                  style={{
                    padding: `${tokensV2.spacing[12]} ${tokensV2.spacing[16]}`,
                    borderRadius: tokensV2.borderRadius.full,
                    background: tokensV2.gradients.primary,
                    border: 'none',
                    color: tokensV2.colors.textOnDark,
                    fontSize: tokensV2.typography.fontSize.sm,
                    fontWeight: tokensV2.typography.fontWeight.semibold,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Invite to chat
                </motion.button>
              </motion.div>
            ))
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: tokensV2.spacing[32],
              textAlign: 'center',
            }}>
              <p style={{
                fontSize: '48px',
                marginBottom: tokensV2.spacing[16],
              }}>
                📭
              </p>
              <p style={{
                color: tokensV2.colors.textSecondary,
                fontSize: tokensV2.typography.fontSize.sm,
              }}>
                No offline friends to invite
              </p>
            </div>
          )}
        </div>
      </div>

      <NavbarV2 />
    </div>
  )
}
