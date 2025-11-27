"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/AppShell"
import { tokens } from "@/lib/design-tokens"
import { checkOnboardingStatus } from "@/lib/user-helpers"
import { motion } from "framer-motion"
import { UserPlus, ArrowRight, ChevronDown } from "lucide-react"
import { Loader2 } from "lucide-react"

const TOPICS = [
  { id: 'israel-gaza', label: 'Israel-Gaza tensions' },
  { id: 'crypto-crash', label: 'Crypto market crash' },
  { id: 'super-bowl', label: 'Super Bowl predictions' },
  { id: 'ai-majors', label: 'AI replacing college majors' },
  { id: 'dc-guard', label: 'DC National Guard shooting' },
]

const TIME_LIMITS = [
  { id: '5', label: '5 minutes', value: 5 },
  { id: '15', label: '15 minutes', value: 15 },
  { id: '30', label: '30 minutes', value: 30 },
]

const FRIEND_GROUPS = [
  { id: 'community', label: 'Community' },
  { id: 'inner-circle', label: 'Inner Circle' },
  { id: 'close-friends', label: 'Close Friends' },
]

export default function TopicMatchPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [selectedTimeLimit, setSelectedTimeLimit] = useState<string | null>(null)
  const [selectedFriendGroup, setSelectedFriendGroup] = useState<string>('community')
  const [onlineFriends, setOnlineFriends] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [loadingFriends, setLoadingFriends] = useState(true)
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)

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
          console.warn('[TopicMatchPage] ⚠️ API error checking onboarding - redirecting to /match')
          router.replace("/match")
          return
        }

        if (!completed) {
          const redirectPath = `/onboarding?step=${step}`
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
          if (currentPath === redirectPath) {
            console.warn('[TopicMatchPage] ⚠️ Already on target path, skipping redirect')
            return
          }
          router.replace(redirectPath)
          return
        }

        setCheckingOnboarding(false)
      } catch (error) {
        console.error('[TopicMatchPage] Error checking onboarding:', error)
        router.replace("/match")
      } finally {
        setCheckingOnboarding(false)
      }
    }
    
    checkAndRedirect()
  }, [authLoading, user, router])

  // Load online friends for selected group
  useEffect(() => {
    if (!user?.id || checkingOnboarding) return

    async function loadOnlineFriends() {
      if (!user) return
      
      try {
        setLoadingFriends(true)
        const response = await fetch(`/api/friends/online?userId=${user.id}`, {
          method: 'GET',
          cache: 'no-store',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            // Filter by selected group
            if (selectedFriendGroup === 'community') {
              setOnlineFriends(data.community || [])
            } else if (selectedFriendGroup === 'inner-circle') {
              setOnlineFriends(data.innerCircle || [])
            } else if (selectedFriendGroup === 'close-friends') {
              setOnlineFriends(data.closeFriends || [])
            } else {
              setOnlineFriends([])
            }
          }
        }
      } catch (error) {
        console.error('[TopicMatchPage] Error loading online friends:', error)
      } finally {
        setLoadingFriends(false)
      }
    }

    loadOnlineFriends()
    const interval = setInterval(loadOnlineFriends, 30000)
    return () => clearInterval(interval)
  }, [user, checkingOnboarding, selectedFriendGroup])

  // Load matches
  useEffect(() => {
    if (!user?.id || checkingOnboarding) return

    async function loadMatches() {
      if (!user) return
      
      try {
        setLoadingMatches(true)
        const response = await fetch(`/api/matches?userId=${user.id}`, {
          method: 'GET',
          cache: 'no-store',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setMatches(Array.isArray(data.data) ? data.data : [])
          } else {
            setMatches([])
          }
        }
      } catch (error) {
        console.error('[TopicMatchPage] Error loading matches:', error)
        setMatches([])
      } finally {
        setLoadingMatches(false)
      }
    }

    loadMatches()
    const interval = setInterval(loadMatches, 30000)
    return () => clearInterval(interval)
  }, [user, checkingOnboarding])

  const handleConnect = () => {
    if (!selectedTopic || !selectedTimeLimit) {
      alert('Please select a topic and time limit before connecting')
      return
    }
    router.push('/match')
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
        {/* Top Bar: Invite + Trending Topic */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: tokens.spacing[20],
        }}>
          {/* Top Left: Circular Invite Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/invite')}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.10)',
              color: tokens.colors.textPrimaryOnDark,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UserPlus style={{ width: '20px', height: '20px' }} />
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
              Trump shoots National Guardsman
            </p>
          </div>
        </div>

        {/* Friend Filter Section */}
        <div style={{
          marginBottom: tokens.spacing[24],
        }}>
          <div style={{
            position: 'relative',
            marginBottom: tokens.spacing[12],
          }}>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                width: '100%',
                padding: `${tokens.spacing[12]} ${tokens.spacing[16]}`,
                borderRadius: tokens.radii.button,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.10)',
                color: tokens.colors.textPrimaryOnDark,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              <span>Select friend group</span>
              <ChevronDown style={{
                width: '16px',
                height: '16px',
                transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }} />
            </motion.button>

            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: tokens.spacing[4],
                  borderRadius: tokens.radii.button,
                  background: tokens.colors.backgroundApp,
                  border: '1px solid rgba(255, 255, 255, 0.10)',
                  overflow: 'hidden',
                  zIndex: 100,
                  boxShadow: tokens.shadows.pillSelected,
                }}
              >
                {FRIEND_GROUPS.map((group) => (
                  <motion.button
                    key={group.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedFriendGroup(group.id)
                      setShowDropdown(false)
                    }}
                    style={{
                      width: '100%',
                      padding: `${tokens.spacing[12]} ${tokens.spacing[16]}`,
                      background: selectedFriendGroup === group.id
                        ? 'rgba(255, 255, 255, 0.10)'
                        : 'transparent',
                      border: 'none',
                      color: tokens.colors.textPrimaryOnDark,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: selectedFriendGroup === group.id ? 600 : 400,
                    }}
                  >
                    {group.label}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Horizontal scroll of online friends */}
          <div style={{
            display: 'flex',
            overflowX: 'auto',
            gap: tokens.spacing[10],
            paddingBottom: tokens.spacing[8],
            WebkitOverflowScrolling: 'touch',
          }} className="no-scrollbar">
            {loadingFriends ? (
              <p style={{ color: tokens.colors.textSecondary, fontSize: '12px' }}>Loading...</p>
            ) : onlineFriends.length > 0 ? (
              onlineFriends.map((friend) => (
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
              <p style={{ color: tokens.colors.textSecondary, fontSize: '12px' }}>No online friends in this group</p>
            )}
          </div>
        </div>

        {/* Topics Section */}
        <div style={{
          marginBottom: tokens.spacing[24],
        }}>
          <h2 style={{
            ...tokens.typography.heading,
            color: tokens.colors.textPrimaryOnDark,
            marginBottom: tokens.spacing[16],
          }}>
            Topics
          </h2>

          <div style={{
            display: 'flex',
            overflowX: 'auto',
            gap: tokens.spacing[12],
            paddingBottom: tokens.spacing[8],
            WebkitOverflowScrolling: 'touch',
          }} className="no-scrollbar">
            {TOPICS.map((topic) => (
              <motion.button
                key={topic.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedTopic(topic.id)}
                style={{
                  minWidth: '140px',
                  padding: tokens.spacing[16],
                  borderRadius: tokens.radii.button,
                  background: selectedTopic === topic.id
                    ? 'rgba(255, 255, 255, 0.10)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: selectedTopic === topic.id
                    ? '2px solid rgba(255, 255, 255, 0.20)'
                    : '1px solid rgba(255, 255, 255, 0.10)',
                  boxShadow: tokens.shadows.pillUnselected,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: tokens.spacing[8],
                }}
              >
                <p style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: tokens.colors.textPrimaryOnDark,
                  margin: 0,
                  textAlign: 'center',
                }}>
                  {topic.label}
                </p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Time Limit Section */}
        <div style={{
          marginBottom: tokens.spacing[24],
        }}>
          <h2 style={{
            ...tokens.typography.heading,
            color: tokens.colors.textPrimaryOnDark,
            marginBottom: tokens.spacing[16],
          }}>
            Choose your time
          </h2>

          <div style={{
            display: 'flex',
            gap: tokens.spacing[12],
            flexWrap: 'wrap',
          }}>
            {TIME_LIMITS.map((time) => (
              <motion.button
                key={time.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedTimeLimit(time.id)}
                style={{
                  flex: 1,
                  minWidth: '100px',
                  padding: `${tokens.spacing[14]} ${tokens.spacing[18]}`,
                  borderRadius: tokens.radii.button,
                  background: selectedTimeLimit === time.id
                    ? 'rgba(255, 255, 255, 0.10)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: selectedTimeLimit === time.id
                    ? '2px solid rgba(255, 255, 255, 0.20)'
                    : '1px solid rgba(255, 255, 255, 0.10)',
                  color: tokens.colors.textPrimaryOnDark,
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                {time.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Matches Section */}
        <div style={{
          marginBottom: tokens.spacing[32],
        }}>
          <h2 style={{
            ...tokens.typography.heading,
            color: tokens.colors.textPrimaryOnDark,
            marginBottom: tokens.spacing[16],
          }}>
            Matches
          </h2>

          {loadingMatches ? (
            <p style={{
              color: tokens.colors.textSecondary,
              textAlign: 'center',
              padding: tokens.spacing[32],
            }}>
              Loading...
            </p>
          ) : matches.length > 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: tokens.spacing[12],
            }}>
              {matches.map((match) => (
                <motion.div
                  key={match.id}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: tokens.spacing[16],
                    borderRadius: tokens.radii.button,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.10)',
                    cursor: 'pointer',
                  }}
                >
                  <p style={{
                    ...tokens.typography.body,
                    color: tokens.colors.textPrimaryOnDark,
                    margin: 0,
                    fontWeight: 500,
                  }}>
                    Match with {match.name || 'User'}
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <p style={{
              color: tokens.colors.textSecondary,
              textAlign: 'center',
              padding: tokens.spacing[32],
            }}>
              No matches right now. Come back later.
            </p>
          )}
        </div>

        {/* CONNECT Button */}
        <div style={{
          marginTop: 'auto',
          paddingTop: tokens.spacing[32],
        }}>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleConnect}
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
    </AppShell>
  )
}

