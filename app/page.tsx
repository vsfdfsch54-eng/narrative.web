"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/AppShell"
import { tokens } from "@/lib/design-tokens"
import { checkOnboardingStatus } from "@/lib/user-helpers"
import { TOPICS } from "@/lib/constants"
import { motion } from "framer-motion"
import { UserPlus, ArrowRight } from "lucide-react"
import { InviteModal } from "@/components/home/InviteModal"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [onlineFriends, setOnlineFriends] = useState<{
    community: any[]
    innerCircle: any[]
    closeFriends: any[]
  }>({
    community: [],
    innerCircle: [],
    closeFriends: [],
  })
  const [loadingFriends, setLoadingFriends] = useState(true)

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      setCheckingOnboarding(false)
      return
    }
    
    async function checkAndRedirect() {
      if (!user) return
      
      setCheckingOnboarding(true)
      
      try {
        const { completed, step, apiError } = await checkOnboardingStatus(user.id)
        
        if (apiError) {
          console.warn('[HomePage] ⚠️ API error checking onboarding - redirecting to /match')
          router.replace("/match")
          return
        }

        if (!completed) {
          const redirectPath = `/onboarding?step=${step}`
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
          if (currentPath === redirectPath) {
            console.warn('[HomePage] ⚠️ Already on target path, skipping redirect')
            return
          }
          router.replace(redirectPath)
          return
        }

        // Complete onboarding → show homepage
        setCheckingOnboarding(false)
      } catch (error) {
        console.error('[HomePage] Error checking onboarding:', error)
        router.replace("/match")
      } finally {
        setCheckingOnboarding(false)
      }
    }
    
    checkAndRedirect()
  }, [authLoading, user, router])

  // Load online friends
  useEffect(() => {
    if (!user?.id || checkingOnboarding) return

    async function loadOnlineFriends() {
      if (!user) return // Additional check for TypeScript
      
      try {
        setLoadingFriends(true)
        const response = await fetch(`/api/friends/online?userId=${user.id}`, {
          method: 'GET',
          cache: 'no-store',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setOnlineFriends({
              community: data.community || [],
              innerCircle: data.innerCircle || [],
              closeFriends: data.closeFriends || [],
            })
          }
        }
      } catch (error) {
        console.error('[HomePage] Error loading online friends:', error)
      } finally {
        setLoadingFriends(false)
      }
    }

    loadOnlineFriends()
    // Refresh every 30 seconds
    const interval = setInterval(loadOnlineFriends, 30000)
    return () => clearInterval(interval)
  }, [user, checkingOnboarding])

  if (authLoading || checkingOnboarding) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0c] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#f1f1f3]/60" />
      </div>
    )
  }

  // Welcome screen - only show if user is NOT authenticated
  if (!user) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0c] w-full h-full overflow-hidden">
        <div className="w-full h-full flex items-center justify-center px-6 py-8">
          <div className="flex flex-col items-center gap-8 w-full max-w-md">
            <div className="text-center space-y-3">
              <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-[#f1f1f3] leading-tight">
                Welcome to Narrative
              </h1>
              <p className="text-sm sm:text-base text-[#f1f1f3]/60 max-w-sm mx-auto">
                Where real connection begins.
              </p>
            </div>
            <div className="flex flex-col gap-4 w-full items-stretch">
              <a
                href="/onboarding"
                className="w-full h-14 text-base font-semibold tracking-wide bg-[#f1f1f3] text-[#0a0a0c] border border-[#f1f1f3] shadow-lg hover:bg-[#f1f1f3]/95 transition-all flex items-center justify-center rounded-full"
              >
                Create an Account
              </a>
              <a
                href="/login"
                className="w-full h-14 text-base font-semibold tracking-wide border-[#f1f1f3]/20 text-[#f1f1f3] hover:border-[#f1f1f3]/40 hover:bg-[#f1f1f3]/5 flex items-center justify-center rounded-full border"
              >
                Sign In
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Split topics into 3 rows
  const topicsPerRow = Math.ceil(TOPICS.length / 3)
  const topicRows = [
    TOPICS.slice(0, topicsPerRow),
    TOPICS.slice(topicsPerRow, topicsPerRow * 2),
    TOPICS.slice(topicsPerRow * 2),
  ]

  return (
    <AppShell>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        padding: `${tokens.spacing[20]} ${tokens.layout.paddingHorizontal}`,
        paddingBottom: '120px', // Space for navbar
      }}>
        {/* Top Bar: Invite + Trending Topic */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: tokens.spacing[20],
        }}>
          {/* Top Left: Invite Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowInviteModal(true)}
            style={{
              padding: `${tokens.spacing[10]} ${tokens.spacing[16]}`,
              borderRadius: tokens.radii.button,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.10)',
              color: tokens.colors.textPrimaryOnDark,
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: tokens.spacing[8],
            }}
          >
            <UserPlus style={{ width: '16px', height: '16px' }} />
            Invite
          </motion.button>

          {/* Top Right: Trending Topic */}
          <div style={{
            padding: `${tokens.spacing[12]} ${tokens.spacing[16]}`,
            borderRadius: tokens.radii.button,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.10)',
            maxWidth: '200px',
          }}>
            <p style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: tokens.colors.textSecondary,
              margin: 0,
              marginBottom: tokens.spacing[4],
            }}>
              Trending Topic of the Day
            </p>
            <p style={{
              fontSize: '13px',
              fontWeight: 500,
              color: tokens.colors.textPrimaryOnDark,
              margin: 0,
              lineHeight: 1.4,
            }}>
              National Guardsmen shot at DC
            </p>
          </div>
        </div>

        {/* Three Rows of Topic Carousels */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: tokens.spacing[20],
          marginBottom: tokens.spacing[32],
        }}>
          {topicRows.map((rowTopics, rowIndex) => (
            <div key={rowIndex} style={{
              display: 'flex',
              overflowX: 'auto',
              gap: tokens.spacing[12],
              paddingBottom: tokens.spacing[8],
              WebkitOverflowScrolling: 'touch',
            }} className="no-scrollbar">
              {rowTopics.map((topic) => (
                <motion.div
                  key={topic.id}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    minWidth: '140px',
                    padding: tokens.spacing[16],
                    borderRadius: tokens.radii.button,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.10)',
                    boxShadow: tokens.shadows.pillUnselected,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: tokens.spacing[8],
                  }}
                >
                  <span style={{ fontSize: '32px' }}>{topic.icon}</span>
                  <p style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: tokens.colors.textPrimaryOnDark,
                    margin: 0,
                    textAlign: 'center',
                  }}>
                    {topic.label}
                  </p>
                </motion.div>
              ))}
            </div>
          ))}
        </div>

        {/* Friends that are online */}
        <div style={{
          marginBottom: tokens.spacing[32],
        }}>
          <h2 style={{
            ...tokens.typography.heading,
            color: tokens.colors.textPrimaryOnDark,
            marginBottom: tokens.spacing[16],
          }}>
            Friends that are online
          </h2>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: tokens.spacing[16],
          }}>
            {/* Community */}
            <div>
              <h3 style={{
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: tokens.colors.textSecondary,
                marginBottom: tokens.spacing[8],
              }}>
                Community
              </h3>
              <div style={{
                display: 'flex',
                overflowX: 'auto',
                gap: tokens.spacing[10],
                paddingBottom: tokens.spacing[8],
                WebkitOverflowScrolling: 'touch',
              }} className="no-scrollbar">
                {loadingFriends ? (
                  <p style={{ color: tokens.colors.textSecondary, fontSize: '12px' }}>Loading...</p>
                ) : onlineFriends.community.length > 0 ? (
                  onlineFriends.community.map((friend) => (
                    <div
                      key={friend.id}
                      style={{
                        minWidth: '60px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: tokens.spacing[4],
                      }}
                    >
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.10)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        position: 'relative',
                      }}>
                        <span>{friend.avatar || '👤'}</span>
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: '#38B57A',
                          border: '2px solid #0B0B0D',
                        }} />
                      </div>
                      <p style={{
                        fontSize: '11px',
                        color: tokens.colors.textSecondary,
                        margin: 0,
                        textAlign: 'center',
                        maxWidth: '60px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {friend.name || 'User'}
                      </p>
                    </div>
                  ))
                ) : (
                  <p style={{ color: tokens.colors.textSecondary, fontSize: '12px' }}>No online friends</p>
                )}
              </div>
            </div>

            {/* Inner Circle */}
            <div>
              <h3 style={{
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: tokens.colors.textSecondary,
                marginBottom: tokens.spacing[8],
              }}>
                Inner Circle
              </h3>
              <div style={{
                display: 'flex',
                overflowX: 'auto',
                gap: tokens.spacing[10],
                paddingBottom: tokens.spacing[8],
                WebkitOverflowScrolling: 'touch',
              }} className="no-scrollbar">
                {loadingFriends ? (
                  <p style={{ color: tokens.colors.textSecondary, fontSize: '12px' }}>Loading...</p>
                ) : onlineFriends.innerCircle.length > 0 ? (
                  onlineFriends.innerCircle.map((friend) => (
                    <div
                      key={friend.id}
                      style={{
                        minWidth: '60px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: tokens.spacing[4],
                      }}
                    >
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.10)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        position: 'relative',
                      }}>
                        <span>{friend.avatar || '👤'}</span>
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: '#38B57A',
                          border: '2px solid #0B0B0D',
                        }} />
                      </div>
                      <p style={{
                        fontSize: '11px',
                        color: tokens.colors.textSecondary,
                        margin: 0,
                        textAlign: 'center',
                        maxWidth: '60px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {friend.name || 'User'}
                      </p>
                    </div>
                  ))
                ) : (
                  <p style={{ color: tokens.colors.textSecondary, fontSize: '12px' }}>No online friends</p>
                )}
              </div>
            </div>

            {/* Close Friends */}
            <div>
              <h3 style={{
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: tokens.colors.textSecondary,
                marginBottom: tokens.spacing[8],
              }}>
                Close Friends
              </h3>
              <div style={{
                display: 'flex',
                overflowX: 'auto',
                gap: tokens.spacing[10],
                paddingBottom: tokens.spacing[8],
                WebkitOverflowScrolling: 'touch',
              }} className="no-scrollbar">
                {loadingFriends ? (
                  <p style={{ color: tokens.colors.textSecondary, fontSize: '12px' }}>Loading...</p>
                ) : onlineFriends.closeFriends.length > 0 ? (
                  onlineFriends.closeFriends.map((friend) => (
                    <div
                      key={friend.id}
                      style={{
                        minWidth: '60px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: tokens.spacing[4],
                      }}
                    >
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.10)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        position: 'relative',
                      }}>
                        <span>{friend.avatar || '👤'}</span>
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: '#38B57A',
                          border: '2px solid #0B0B0D',
                        }} />
                      </div>
                      <p style={{
                        fontSize: '11px',
                        color: tokens.colors.textSecondary,
                        margin: 0,
                        textAlign: 'center',
                        maxWidth: '60px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {friend.name || 'User'}
                      </p>
                    </div>
                  ))
                ) : (
                  <p style={{ color: tokens.colors.textSecondary, fontSize: '12px' }}>No online friends</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: CONNECT Button */}
        <div style={{
          marginTop: 'auto',
          paddingTop: tokens.spacing[32],
        }}>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/match')}
            style={{
              width: '100%',
              padding: `${tokens.spacing[18]} ${tokens.spacing[20]}`,
              borderRadius: tokens.radii.button,
              background: tokens.colors.pillSelected,
              border: 'none',
              color: tokens.colors.textOnPill,
              fontSize: '18px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: tokens.spacing[10],
              boxShadow: tokens.shadows.pillSelected,
            }}
          >
            CONNECT
            <ArrowRight style={{ width: '20px', height: '20px' }} />
          </motion.button>
        </div>
      </div>

      {/* Invite Modal */}
      {user && (
        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          currentUserId={user.id}
        />
      )}
    </AppShell>
  )
}
