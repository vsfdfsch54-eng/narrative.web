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
  { id: 'israel-gaza', label: 'Israel–Gaza tensions' },
  { id: 'crypto-crash', label: 'Crypto market crash' },
  { id: 'ai-jobs', label: 'AI replacing jobs' },
  { id: 'dc-guard', label: 'DC National Guard shooting' },
  { id: 'college-life', label: 'College life & stress' },
  { id: 'dating', label: 'Dating & relationships' },
]

const TIME_LIMITS = [
  { id: '5', label: '5 min', value: 5 },
  { id: '15', label: '15 min', value: 15 },
  { id: '30', label: '30 min', value: 30 },
]

const FRIEND_GROUPS = [
  { id: 'community', label: 'Community' },
  { id: 'inner-circle', label: 'Inner Circle' },
  { id: 'close-friends', label: 'Close Friends' },
]

export default function HomePage() {
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
  const [savingTopic, setSavingTopic] = useState(false)

  // Routing guard: Check auth and onboarding
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
          console.warn('[HomePage] ⚠️ API error checking onboarding - allowing access')
          setCheckingOnboarding(false)
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

        setCheckingOnboarding(false)
      } catch (error) {
        console.error('[HomePage] Error checking onboarding:', error)
        setCheckingOnboarding(false)
      }
    }
    
    checkAndRedirect()
  }, [authLoading, user, router])

  // Load user's current topic preference
  useEffect(() => {
    if (!user?.id || checkingOnboarding) return

    async function loadUserTopic() {
      if (!user?.id) return
      try {
        const response = await fetch(`/api/users?userId=${user.id}`, {
          method: 'GET',
          cache: 'no-store',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data?.topic) {
            setSelectedTopic(data.data.topic)
          }
        }
      } catch (error) {
        console.error('[HomePage] Error loading user topic:', error)
      }
    }

    loadUserTopic()
  }, [user, checkingOnboarding])

  // Save topic to user profile when changed
  const handleTopicSelect = async (topicId: string) => {
    if (!user || !user.id || savingTopic) return

    setSelectedTopic(topicId)
    setSavingTopic(true)

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          topic: topicId,
        }),
      })

      if (!response.ok) {
        console.error('[HomePage] Failed to save topic')
      }
    } catch (error) {
      console.error('[HomePage] Error saving topic:', error)
    } finally {
      setSavingTopic(false)
    }
  }

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
            const groupKey = selectedFriendGroup === 'community' ? 'community' :
                           selectedFriendGroup === 'inner-circle' ? 'innerCircle' : 'closeFriends'
            setOnlineFriends(data[groupKey] || [])
          }
        }
      } catch (error) {
        console.error('[HomePage] Error loading online friends:', error)
        setOnlineFriends([])
      } finally {
        setLoadingFriends(false)
      }
    }

    loadOnlineFriends()
    const interval = setInterval(loadOnlineFriends, 30000)
    return () => clearInterval(interval)
  }, [user, checkingOnboarding, selectedFriendGroup])

  // Load active matches with user names
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
          if (data.success && Array.isArray(data.data)) {
            // Filter to only active matches
            const activeMatches = data.data.filter((match: any) => match.status === 'active')
            
            // Fetch user names for each match
            const matchesWithNames = await Promise.all(
              activeMatches.map(async (match: any) => {
                const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id
                try {
                  const userResponse = await fetch(`/api/users?userId=${otherUserId}`, {
                    method: 'GET',
                    cache: 'no-store',
                  })
                  if (userResponse.ok) {
                    const userData = await userResponse.json()
                    if (userData.success && userData.data) {
                      return {
                        ...match,
                        otherUserName: userData.data.name || 'User',
                        otherUserMood: userData.data.mood || null,
                        otherUserTopic: userData.data.topic || null,
                      }
                    }
                  }
                } catch (error) {
                  console.error('[HomePage] Error fetching user name:', error)
                }
                return {
                  ...match,
                  otherUserName: 'User',
                  otherUserMood: null,
                  otherUserTopic: null,
                }
              })
            )
            
            setMatches(matchesWithNames)
          }
        }
      } catch (error) {
        console.error('[HomePage] Error loading matches:', error)
        setMatches([])
      } finally {
        setLoadingMatches(false)
      }
    }

    loadMatches()
    const interval = setInterval(loadMatches, 30000)
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

  return (
    <AppShell>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        padding: `${tokens.spacing[20]} ${tokens.layout.paddingHorizontal}`,
        paddingBottom: '120px', // Space for navbar
      }}>
        {/* TOP BAR: Invite + Trending Topic */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: tokens.spacing[28],
        }}>
          {/* Top Left: Invite Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/invite')}
            style={{
              padding: `${tokens.spacing[10]} ${tokens.spacing[16]}`,
              borderRadius: '50%',
              width: '44px',
              height: '44px',
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

        {/* TOPICS SECTION */}
        <div style={{
          marginBottom: tokens.spacing[28],
        }}>
          <h2 style={{
            ...tokens.typography.heading,
            color: tokens.colors.textPrimaryOnDark,
            marginBottom: tokens.spacing[16],
            fontSize: '18px',
          }}>
            What do you want to talk about?
          </h2>
          <div style={{
            display: 'flex',
            overflowX: 'auto',
            gap: tokens.spacing[12],
            paddingBottom: tokens.spacing[8],
            WebkitOverflowScrolling: 'touch',
          }} className="no-scrollbar">
            {TOPICS.map((topic) => {
              const isSelected = selectedTopic === topic.id
              return (
                <motion.button
                  key={topic.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTopicSelect(topic.id)}
                  style={{
                    padding: `${tokens.spacing[12]} ${tokens.spacing[18]}`,
                    borderRadius: '9999px',
                    background: isSelected 
                      ? 'rgba(255, 255, 255, 0.15)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${isSelected ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.10)'}`,
                    color: tokens.colors.textPrimaryOnDark,
                    fontSize: '14px',
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {topic.label}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* TIME LIMIT SECTION */}
        <div style={{
          marginBottom: tokens.spacing[28],
        }}>
          <h2 style={{
            ...tokens.typography.heading,
            color: tokens.colors.textPrimaryOnDark,
            marginBottom: tokens.spacing[16],
            fontSize: '18px',
          }}>
            How long do you want to chat?
          </h2>
          <div style={{
            display: 'flex',
            gap: tokens.spacing[12],
          }}>
            {TIME_LIMITS.map((limit) => {
              const isSelected = selectedTimeLimit === limit.id
              return (
                <motion.button
                  key={limit.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedTimeLimit(limit.id)}
                  style={{
                    padding: `${tokens.spacing[12]} ${tokens.spacing[18]}`,
                    borderRadius: '9999px',
                    background: isSelected 
                      ? 'rgba(255, 255, 255, 0.15)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${isSelected ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.10)'}`,
                    color: tokens.colors.textPrimaryOnDark,
                    fontSize: '14px',
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {limit.label}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* MATCHES SECTION */}
        <div style={{
          marginBottom: tokens.spacing[28],
        }}>
          <h2 style={{
            ...tokens.typography.heading,
            color: tokens.colors.textPrimaryOnDark,
            marginBottom: tokens.spacing[16],
            fontSize: '18px',
          }}>
            Matches
          </h2>
          {loadingMatches ? (
            <p style={{
              color: tokens.colors.textSecondary,
              fontSize: '14px',
            }}>
              Loading...
            </p>
          ) : matches.length > 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: tokens.spacing[12],
            }}>
              {matches.slice(0, 3).map((match: any) => {
                if (!user) return null
                const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id
                return (
                <motion.div
                  key={match.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    router.push(`/chat/${otherUserId}?matchId=${match.id}`)
                  }}
                  style={{
                    padding: tokens.spacing[12],
                    borderRadius: tokens.radii.button,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.10)',
                    cursor: 'pointer',
                  }}
                >
                  <p style={{
                    color: tokens.colors.textPrimaryOnDark,
                    fontSize: '14px',
                    fontWeight: 500,
                    margin: 0,
                    marginBottom: tokens.spacing[4],
                  }}>
                    {match.otherUserName || 'User'}
                  </p>
                  {(match.otherUserMood || match.otherUserTopic) && (
                    <p style={{
                      color: tokens.colors.textSecondary,
                      fontSize: '12px',
                      margin: 0,
                    }}>
                      {match.otherUserMood ? `😊 ${match.otherUserMood}` : ''}
                      {match.otherUserMood && match.otherUserTopic ? ' • ' : ''}
                      {match.otherUserTopic ? `📌 ${match.otherUserTopic}` : ''}
                    </p>
                  )}
                </motion.div>
                )
              })}
            </div>
          ) : (
            <p style={{
              color: tokens.colors.textSecondary,
              fontSize: '14px',
            }}>
              No matches right now. Come back later.
            </p>
          )}
        </div>

        {/* FRIENDS ONLINE SECTION */}
        <div style={{
          marginBottom: tokens.spacing[32],
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: tokens.spacing[16],
          }}>
            <h2 style={{
              ...tokens.typography.heading,
              color: tokens.colors.textPrimaryOnDark,
              fontSize: '18px',
              margin: 0,
            }}>
              Friends Online
            </h2>
            <div style={{ position: 'relative' }}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  padding: `${tokens.spacing[8]} ${tokens.spacing[12]}`,
                  borderRadius: tokens.radii.button,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.10)',
                  color: tokens.colors.textPrimaryOnDark,
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: tokens.spacing[8],
                }}
              >
                {FRIEND_GROUPS.find(g => g.id === selectedFriendGroup)?.label || 'Community'}
                <ChevronDown style={{ width: '16px', height: '16px' }} />
              </motion.button>
              {showDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: tokens.spacing[8],
                  padding: tokens.spacing[8],
                  borderRadius: tokens.radii.button,
                  background: 'rgba(0, 0, 0, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.10)',
                  minWidth: '150px',
                  zIndex: 100,
                }}>
                  {FRIEND_GROUPS.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => {
                        setSelectedFriendGroup(group.id)
                        setShowDropdown(false)
                      }}
                      style={{
                        width: '100%',
                        padding: `${tokens.spacing[8]} ${tokens.spacing[12]}`,
                        borderRadius: tokens.radii.button,
                        background: selectedFriendGroup === group.id 
                          ? 'rgba(255, 255, 255, 0.10)' 
                          : 'transparent',
                        border: 'none',
                        color: tokens.colors.textPrimaryOnDark,
                        fontSize: '13px',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      {group.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
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
              <p style={{ color: tokens.colors.textSecondary, fontSize: '12px' }}>
                No one online right now
              </p>
            )}
          </div>
        </div>

        {/* BOTTOM: CONNECT BUTTON */}
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
    </AppShell>
  )
}
