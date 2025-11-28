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
      <div className="max-w-[540px] mx-auto px-4 py-6 space-y-8 pb-32">
        {/* TOP BAR: Invite + Trending Topic */}
        <div className="flex items-center justify-between">
          {/* Top Left: Invite Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/invite')}
            className="w-11 h-11 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-200 hover:bg-neutral-700 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
          </motion.button>

          {/* Top Right: Trending Topic */}
          <div className="px-4 py-3 rounded-lg bg-neutral-800 border border-neutral-700 max-w-[200px]">
            <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
              Trending Topic of the Day
            </p>
            <p className="text-sm font-medium text-neutral-200 leading-snug">
              Trump shoots National Guardsman
            </p>
          </div>
        </div>

        {/* TOPICS SECTION */}
        <div>
          <h2 className="text-xl font-semibold text-neutral-200 mb-4">
            What do you want to talk about?
          </h2>
          <div className="flex space-x-3 overflow-x-auto no-scrollbar py-2">
            {TOPICS.map((topic) => {
              const isSelected = selectedTopic === topic.id
              return (
                <motion.button
                  key={topic.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTopicSelect(topic.id)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full border transition-colors ${
                    isSelected
                      ? 'bg-neutral-700 border-neutral-600 text-neutral-100 font-semibold'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-200 font-medium'
                  }`}
                >
                  {topic.label}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* TIME LIMIT SECTION */}
        <div>
          <h2 className="text-xl font-semibold text-neutral-200 pt-4">
            How long do you want to chat?
          </h2>
          <div className="flex space-x-4 pt-2">
            {TIME_LIMITS.map((limit) => {
              const isSelected = selectedTimeLimit === limit.id
              return (
                <motion.button
                  key={limit.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedTimeLimit(limit.id)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full border transition-colors ${
                    isSelected
                      ? 'bg-neutral-700 border-neutral-600 text-neutral-100 font-semibold'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-200 font-medium'
                  }`}
                >
                  {limit.label}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* MATCHES SECTION */}
        <div>
          <h2 className="text-xl font-semibold text-neutral-200 mb-4">
            Matches
          </h2>
          {loadingMatches ? (
            <p className="text-neutral-400 text-sm">Loading...</p>
          ) : matches.length > 0 ? (
            <div className="space-y-3">
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
                    className="p-3 rounded-lg bg-neutral-800 border border-neutral-700 cursor-pointer hover:bg-neutral-750 transition-colors"
                  >
                    <p className="text-sm font-medium text-neutral-200 mb-1">
                      {match.otherUserName || 'User'}
                    </p>
                    {(match.otherUserMood || match.otherUserTopic) && (
                      <p className="text-xs text-neutral-400">
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
            <p className="text-neutral-400 text-sm">
              No matches right now. Come back later.
            </p>
          )}
        </div>

        {/* FRIENDS ONLINE SECTION */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-neutral-200">
              Friends Online
            </h2>
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowDropdown(!showDropdown)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200 text-sm font-medium flex items-center gap-2 hover:bg-neutral-750 transition-colors"
              >
                {FRIEND_GROUPS.find(g => g.id === selectedFriendGroup)?.label || 'Community'}
                <ChevronDown className="w-4 h-4" />
              </motion.button>
              {showDropdown && (
                <div className="absolute top-full right-0 mt-2 p-2 rounded-lg bg-black border border-neutral-700 min-w-[150px] z-50">
                  {FRIEND_GROUPS.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => {
                        setSelectedFriendGroup(group.id)
                        setShowDropdown(false)
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                        selectedFriendGroup === group.id
                          ? 'bg-neutral-800 text-neutral-200'
                          : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                      }`}
                    >
                      {group.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex space-x-4 overflow-x-auto no-scrollbar py-2">
            {loadingFriends ? (
              <p className="text-neutral-400 text-sm">Loading...</p>
            ) : onlineFriends.length > 0 ? (
              onlineFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex-shrink-0 flex flex-col items-center gap-2 min-w-[60px]"
                >
                  <div className="relative w-12 h-12 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-2xl">
                    <span>{friend.avatar || '👤'}</span>
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[#0a0a0c]" />
                  </div>
                  <p className="text-xs text-neutral-400 text-center max-w-[60px] truncate">
                    {friend.name || 'User'}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-neutral-400 text-sm">
                No one online right now
              </p>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM: CONNECT BUTTON (Sticky) */}
      <div className="fixed bottom-24 left-0 right-0 flex justify-center px-4 z-40">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push('/match')}
          className="w-full max-w-[540px] py-4 px-5 rounded-full bg-white text-black font-semibold text-lg flex items-center justify-center gap-2 shadow-lg hover:bg-neutral-100 transition-colors"
        >
          CONNECT
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </AppShell>
  )
}
