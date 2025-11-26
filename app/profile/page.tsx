"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Save, Users, Edit2, Bell, Check, X, LogOut } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/AppShell"
import { tokens } from "@/lib/design-tokens"
import { checkOnboardingStatus } from "@/lib/user-helpers"

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const [userName, setUserName] = useState("")
  const [quoteOfDay, setQuoteOfDay] = useState("")
  const [communityMembers, setCommunityMembers] = useState<{ id: string; name: string }[]>([])
  const [recentChats, setRecentChats] = useState<any[]>([])
  const [loadingChats, setLoadingChats] = useState(true)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState("")
  const [notifications, setNotifications] = useState<any[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(true)
  const [personalitySummary, setPersonalitySummary] = useState<string | null>(null)
  const [personalityTraits, setPersonalityTraits] = useState<any>(null)
  const [loadingPersonality, setLoadingPersonality] = useState(true)

  // Routing guard: Check auth and onboarding status
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return
    }

    // USER LOGGED OUT → Redirect to welcome page
    if (!user) {
      router.replace("/")
      return
    }

    // USER LOGGED IN → Check onboarding status
    async function checkOnboarding() {
      if (!user) return
      
      try {
        const { completed, step, apiError } = await checkOnboardingStatus(user.id)

        // NEVER redirect on API errors - causes redirect loops
        if (apiError) {
          console.warn('[ProfilePage] ⚠️ API error checking onboarding - allowing access to prevent loop')
          // Allow access - don't redirect on API errors
          return
        }

        if (!completed) {
          // Incomplete onboarding → redirect to onboarding
          // Safety check: prevent redirect loops
          const redirectPath = `/onboarding?step=${step}`
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
          if (currentPath === redirectPath) {
            console.warn('[ProfilePage] ⚠️ Already on target path, skipping redirect to prevent loop')
            return
          }
          router.replace(redirectPath)
          return
        }

        // Complete onboarding → allow access to profile page
        // No redirect needed, just render the page
      } catch (error) {
        console.error('[ProfilePage] Error checking onboarding:', error)
        // On error, allow access - don't redirect to prevent loops
        console.warn('[ProfilePage] ⚠️ Error in checkOnboarding - allowing access to prevent loop')
      }
    }

    checkOnboarding()
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user?.id) return

    const loadProfile = async () => {
      setLoadingProfile(true)
      try {
        const response = await fetch(`/api/users?userId=${user.id}`)
        const data = await response.json()
        
        if (data.success && data.data) {
          const savedName = data.data.name
          if (savedName && savedName.trim()) {
            setUserName(savedName.trim())
            setTempName(savedName.trim())
          } else {
            const fallbackName = user.user_metadata?.name || user.email?.split('@')[0] || "User"
            setUserName(fallbackName)
            setTempName(fallbackName)
          }
          
          // Load personality data
          if (data.data.personality_summary) {
            setPersonalitySummary(data.data.personality_summary)
          }
          if (data.data.traits) {
            setPersonalityTraits(data.data.traits)
          }
        } else {
          const fallbackName = user.user_metadata?.name || user.email?.split('@')[0] || "User"
          setUserName(fallbackName)
          setTempName(fallbackName)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        const fallbackName = user.user_metadata?.name || user.email?.split('@')[0] || "User"
        setUserName(fallbackName)
        setTempName(fallbackName)
      } finally {
        setLoadingProfile(false)
        setLoadingPersonality(false)
      }
    }

    loadProfile()
  }, [user])

  useEffect(() => {
    if (!user?.id) return

    const savedQuote = localStorage.getItem("quoteOfDay")
    if (savedQuote) {
      setQuoteOfDay(savedQuote)
    }

    const community = JSON.parse(localStorage.getItem("communityMembers") || "[]")
    setCommunityMembers(community)

    const loadRecentChats = async () => {
      setLoadingChats(true)
      try {
        const response = await fetch(`/api/chats?userId=${user.id}&type=recent&limit=5`)
        const data = await response.json()
        if (data.success && data.data) {
          setRecentChats(data.data)
        } else {
          setRecentChats([])
        }
      } catch (error) {
        console.error('Error loading recent chats:', error)
        setRecentChats([])
      } finally {
        setLoadingChats(false)
      }
    }

    loadRecentChats()

    // Load notifications
    const loadNotifications = async () => {
      setLoadingNotifications(true)
      try {
        const response = await fetch(`/api/notifications?userId=${user.id}`)
        const data = await response.json()
        if (data.success && data.data) {
          setNotifications(data.data)
        } else {
          setNotifications([])
        }
      } catch (error) {
        console.error('Error loading notifications:', error)
        setNotifications([])
      } finally {
        setLoadingNotifications(false)
      }
    }

    loadNotifications()
    
    // Poll for new notifications every 5 seconds
    const notificationInterval = setInterval(loadNotifications, 5000)
    return () => clearInterval(notificationInterval)
  }, [user])

  const handleSaveQuote = () => {
    localStorage.setItem("quoteOfDay", quoteOfDay)
  }

  const handleSaveName = async () => {
    if (!user?.id || !tempName.trim()) {
      setTempName(userName)
      setIsEditingName(false)
      return
    }

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: tempName.trim(),
          interests: []
        })
      })

      const data = await response.json()
      if (data.success) {
        setUserName(tempName.trim())
        setIsEditingName(false)
      } else {
        setTempName(userName)
        setIsEditingName(false)
      }
    } catch (error) {
      console.error('Error saving name:', error)
      setTempName(userName)
      setIsEditingName(false)
    }
  }

  const handleAcceptNotification = async (notificationId: string) => {
    if (!user?.id) return
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId,
          userId: user.id,
          action: 'accept',
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        alert('Added to community!')
      } else {
        alert('Failed to accept request. Please try again.')
      }
    } catch (error) {
      console.error('Error accepting notification:', error)
      alert('Failed to accept request. Please try again.')
    }
  }

  const handleDismissNotification = async (notificationId: string) => {
    if (!user?.id) return
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId,
          userId: user.id,
          action: 'read',
        })
      })
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
      }
    } catch (error) {
      console.error('Error dismissing notification:', error)
    }
  }

  if (authLoading || loadingProfile) {
    return (
      <AppShell>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <p style={{ color: tokens.colors.textSecondary }}>Loading...</p>
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
        gap: tokens.spacing[28],
        paddingTop: tokens.layout.topTitleSpacing, 
        paddingBottom: '120px' 
      }}>
        {/* Header Section - Name and Quote */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: tokens.spacing[20],
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '64px' }}>👤</div>
          
          {isEditingName ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: tokens.spacing[12], width: '100%' }}>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                style={{
                  ...tokens.typography.heading,
                  color: tokens.colors.textPrimaryOnDark,
                  background: 'transparent',
                  border: 'none',
                  borderRadius: tokens.radii.input,
                  padding: `${tokens.spacing[12]} ${tokens.spacing[18]}`,
                  textAlign: 'center',
                  maxWidth: '300px',
                  width: '100%',
                  outline: 'none',
                  boxShadow: tokens.shadows.pillUnselected,
                }}
                autoFocus
                onBlur={handleSaveName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName()
                  if (e.key === 'Escape') {
                    setTempName(userName)
                    setIsEditingName(false)
                  }
                }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: tokens.spacing[12] }}>
              <h1 style={{ 
                ...tokens.typography.title,
                color: tokens.colors.textPrimaryOnDark,
                margin: 0,
              }}>
                {userName || "User"}
              </h1>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditingName(true)}
                style={{
                  padding: tokens.spacing[8],
                  borderRadius: tokens.radii.button,
                  background: 'transparent',
                  border: 'none',
                  color: tokens.colors.textSecondary,
                  cursor: 'pointer',
                }}
              >
                <Edit2 style={{ width: '18px', height: '18px' }} />
              </motion.button>
            </div>
          )}
          
          <textarea
            value={quoteOfDay}
            onChange={(e) => setQuoteOfDay(e.target.value)}
            onBlur={handleSaveQuote}
            placeholder="What's on your mind today?"
            style={{
              width: '100%',
              maxWidth: tokens.layout.maxWidth,
              minHeight: '80px',
              padding: `${tokens.spacing[16]} ${tokens.spacing[20]}`,
              background: 'transparent',
              border: 'none',
              borderRadius: tokens.radii.input,
              color: tokens.colors.textSecondary,
              ...tokens.typography.body,
              resize: 'none',
              outline: 'none',
              boxShadow: tokens.shadows.pillUnselected,
            }}
            rows={3}
          />
        </div>

        {/* Personality Profile Section */}
        {personalitySummary && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: tokens.spacing[20],
            paddingTop: tokens.spacing[28],
            // No border - using spacing only
          }}>
            <h2 style={{ 
              ...tokens.typography.heading,
              color: tokens.colors.textPrimaryOnDark,
              margin: 0,
              textAlign: 'center',
            }}>
              Your Personality
            </h2>
            
            {loadingPersonality ? (
              <p style={{ ...tokens.typography.body, color: tokens.colors.textSecondary, textAlign: 'center' }}>
                Loading personality profile...
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[20] }}>
                {/* Personality Summary */}
                <div>
                  <p style={{ 
                    ...tokens.typography.body,
                    color: tokens.colors.textSecondary,
                    lineHeight: 1.6,
                    margin: 0,
                    textAlign: 'center',
                  }}>
                    {personalitySummary}
                  </p>
                </div>

                {/* Personality Traits */}
                {personalityTraits && (
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: tokens.spacing[10],
                    justifyContent: 'center',
                  }}>
                    {personalityTraits.communicationStyle && (
                      <span style={{
                        padding: `6px ${tokens.spacing[14]}`,
                        borderRadius: tokens.radii.pill,
                        background: tokens.colors.pillUnselected,
                        color: tokens.colors.textOnPill,
                        fontSize: '12px',
                        fontWeight: 500,
                        textTransform: 'capitalize',
                      }}>
                        {personalityTraits.communicationStyle}
                      </span>
                    )}
                    {personalityTraits.socialEnergy && (
                      <span style={{
                        padding: `6px ${tokens.spacing[14]}`,
                        borderRadius: tokens.radii.pill,
                        background: tokens.colors.pillUnselected,
                        color: tokens.colors.textOnPill,
                        fontSize: '12px',
                        fontWeight: 500,
                        textTransform: 'capitalize',
                      }}>
                        {personalityTraits.socialEnergy}
                      </span>
                    )}
                    {personalityTraits.conversationDepth && (
                      <span style={{
                        padding: `6px ${tokens.spacing[14]}`,
                        borderRadius: tokens.radii.pill,
                        background: tokens.colors.pillUnselected,
                        color: tokens.colors.textOnPill,
                        fontSize: '12px',
                        fontWeight: 500,
                        textTransform: 'capitalize',
                      }}>
                        {personalityTraits.conversationDepth}
                      </span>
                    )}
                    {personalityTraits.socialIntention && Array.isArray(personalityTraits.socialIntention) && personalityTraits.socialIntention.length > 0 && (
                      personalityTraits.socialIntention.map((intention: string) => (
                        <span
                          key={intention}
                          style={{
                            padding: `6px ${tokens.spacing[14]}`,
                            borderRadius: tokens.radii.pill,
                            background: tokens.colors.pillUnselected,
                            color: tokens.colors.textOnPill,
                            fontSize: '12px',
                            fontWeight: 500,
                            textTransform: 'capitalize',
                          }}
                        >
                          {intention}
                        </span>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Friends Section */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: tokens.spacing[20],
          paddingTop: tokens.spacing[28],
          borderTop: `1px solid rgba(255,255,255,0.08)`,
        }}>
          <h2 style={{ 
            ...tokens.typography.heading,
            color: tokens.colors.textPrimaryOnDark,
            margin: 0,
            textAlign: 'center',
          }}>
            My Friends
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[16] }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: `${tokens.spacing[16]} 0`,
              borderBottom: `1px solid rgba(255,255,255,0.05)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[12] }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: tokens.colors.accentOrange }} />
                <p style={{ ...tokens.typography.body, color: tokens.colors.textPrimaryOnDark, fontWeight: 500, margin: 0 }}>
                  Inner Circle
                </p>
              </div>
              <span style={{ ...tokens.typography.body, color: tokens.colors.textSecondary }}>0</span>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: `${tokens.spacing[16]} 0`,
              borderBottom: `1px solid rgba(255,255,255,0.05)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[12] }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: tokens.colors.accentBlue }} />
                <p style={{ ...tokens.typography.body, color: tokens.colors.textPrimaryOnDark, fontWeight: 500, margin: 0 }}>
                  Close Friends
                </p>
              </div>
              <span style={{ ...tokens.typography.body, color: tokens.colors.textSecondary }}>0</span>
            </div>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: tokens.spacing[12],
              padding: `${tokens.spacing[16]} 0`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[12] }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: tokens.colors.accentGreen }} />
                  <p style={{ ...tokens.typography.body, color: tokens.colors.textPrimaryOnDark, fontWeight: 500, margin: 0 }}>
                    Community
                  </p>
                </div>
                <span style={{ ...tokens.typography.body, color: tokens.colors.textSecondary }}>{communityMembers.length}</span>
              </div>
              {communityMembers.length > 0 ? (
                <div style={{ display: 'flex', gap: tokens.spacing[10], overflowX: 'auto', paddingTop: tokens.spacing[8] }}>
                  {communityMembers.map((member) => (
                    <motion.button
                      key={member.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push(`/chat/${member.id}`)}
                      style={{
                        padding: `8px ${tokens.spacing[16]}`,
                        borderRadius: tokens.radii.pill,
                        background: tokens.colors.pillUnselected,
                        color: tokens.colors.textOnPill,
                        border: 'none',
                        boxShadow: tokens.shadows.pillUnselected,
                        ...tokens.typography.label,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                      }}
                    >
                      {member.name}
                    </motion.button>
                  ))}
                </div>
              ) : (
                <p style={{ ...tokens.typography.body, color: tokens.colors.textSecondary, margin: 0, fontSize: '13px' }}>
                  No community members yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Chats Section */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: tokens.spacing[16],
          paddingTop: tokens.spacing[28],
          borderTop: `1px solid rgba(255,255,255,0.08)`,
        }}>
          <h2 style={{ 
            ...tokens.typography.heading,
            color: tokens.colors.textPrimaryOnDark,
            margin: 0,
            textAlign: 'center',
          }}>
            Recent Chats
          </h2>
          
          {loadingChats ? (
            <p style={{ ...tokens.typography.body, color: tokens.colors.textSecondary, textAlign: 'center' }}>
              Loading...
            </p>
          ) : recentChats.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[12] }}>
              {recentChats.map((chat) => {
                const otherUserId = chat.user1_id === user.id ? chat.user2_id : chat.user1_id
                return (
                  <motion.button
                    key={chat.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(`/chat/${otherUserId}?matchId=${chat.id}`)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: tokens.spacing[16],
                      padding: `${tokens.spacing[16]} 0`,
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderBottom: `1px solid rgba(255,255,255,0.05)`,
                    }}
                  >
                    <span style={{ fontSize: '32px' }}>👤</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ ...tokens.typography.body, fontWeight: 500, color: tokens.colors.textPrimaryOnDark, margin: 0 }}>
                        User {otherUserId.slice(0, 8)}
                      </p>
                      <p style={{ ...tokens.typography.label, color: tokens.colors.textSecondary, margin: 0, marginTop: tokens.spacing[4] }}>
                        {new Date(chat.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          ) : (
            <p style={{ ...tokens.typography.body, color: tokens.colors.textSecondary, textAlign: 'center' }}>
              No recent chats
            </p>
          )}
        </div>

        {/* Sign Out Button */}
        <div style={{ paddingTop: tokens.spacing[28], borderTop: `1px solid rgba(255,255,255,0.08)` }}>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={async () => {
              await signOut()
              router.push("/")
            }}
            style={{
              width: '100%',
              padding: `${tokens.spacing[14]} ${tokens.spacing[20]}`,
              borderRadius: tokens.radii.button,
              background: 'transparent',
              border: `1px solid rgba(255,255,255,0.12)`,
              color: tokens.colors.textPrimaryOnDark,
              ...tokens.typography.body,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: tokens.spacing[10],
            }}
          >
            <LogOut style={{ width: '18px', height: '18px' }} />
            Sign Out
          </motion.button>
        </div>
      </div>
    </AppShell>
  )
}
