"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { ArrowLeft, Save, Users, Edit2, MessageSquare } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { colors, typography, spacing, components, motion as motionConfig } from "@/lib/design-system"

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

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
    }
  }, [user, authLoading, router])

  // Load user profile
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

  if (authLoading || loadingProfile) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: colors.background }}>
        <p style={{ color: colors.textSecondary }}>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div 
      className="fixed inset-0 overflow-hidden w-full h-full"
      style={{ 
        background: colors.background,
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div 
          className="flex items-center justify-between flex-shrink-0"
          style={{
            padding: spacing.md,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            transition={{ duration: motionConfig.duration.fast / 1000, ease: motionConfig.easing }}
            onClick={() => router.push("/vibe")}
            style={{
              padding: '8px',
              borderRadius: components.button.radius,
              color: colors.textSecondary,
            }}
            className="hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>

          <h1 style={{ 
            fontSize: typography.titleMD.fontSize, 
            fontWeight: typography.titleMD.fontWeight,
            letterSpacing: typography.titleMD.letterSpacing,
            color: colors.textPrimary 
          }}>
            Profile
          </h1>

          <motion.button
            whileTap={{ scale: 0.98 }}
            transition={{ duration: motionConfig.duration.fast / 1000, ease: motionConfig.easing }}
            onClick={() => router.push("/conversations")}
            style={{
              padding: '8px',
              borderRadius: components.button.radius,
              color: colors.textSecondary,
            }}
            className="hover:opacity-80 transition-opacity"
          >
            <MessageSquare className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto"
          style={{ padding: spacing.screen }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
            {/* Profile Header */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: spacing.sm }}>👤</div>
              {isEditingName ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing.sm }}>
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    style={{
                      fontSize: typography.titleMD.fontSize,
                      fontWeight: typography.titleMD.fontWeight,
                      color: colors.textPrimary,
                      background: components.input.background,
                      border: `1px solid ${components.input.border}`,
                      borderRadius: components.input.radius,
                      padding: '8px 12px',
                      textAlign: 'center',
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing.sm }}>
                  <h2 style={{ 
                    fontSize: typography.titleMD.fontSize,
                    fontWeight: typography.titleMD.fontWeight,
                    letterSpacing: typography.titleMD.letterSpacing,
                    color: colors.textPrimary 
                  }}>
                    {userName || "User"}
                  </h2>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: motionConfig.duration.fast / 1000, ease: motionConfig.easing }}
                    onClick={() => setIsEditingName(true)}
                    style={{
                      padding: '4px',
                      borderRadius: '6px',
                      color: colors.textMuted,
                    }}
                    className="hover:opacity-80 transition-opacity"
                  >
                    <Edit2 className="w-4 h-4" />
                  </motion.button>
                </div>
              )}
            </div>

            {/* What's on my mind */}
            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                <textarea
                  value={quoteOfDay}
                  onChange={(e) => setQuoteOfDay(e.target.value)}
                  onBlur={handleSaveQuote}
                  placeholder="What's on your mind today?"
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    padding: spacing.md,
                    background: components.input.background,
                    border: `1px solid ${components.input.border}`,
                    borderRadius: components.input.radius,
                    color: colors.textPrimary,
                    fontSize: typography.body.fontSize,
                    resize: 'none',
                  }}
                  rows={2}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: motionConfig.duration.fast / 1000, ease: motionConfig.easing }}
                    onClick={handleSaveQuote}
                    style={{
                      padding: '8px',
                      borderRadius: components.button.radius,
                      background: colors.chipBg,
                      color: colors.chipText,
                    }}
                  >
                    <Save className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </Card>

            {/* What People Say */}
            <Card>
              <h3 style={{ 
                fontSize: typography.titleMD.fontSize,
                fontWeight: typography.titleMD.fontWeight,
                color: colors.textPrimary,
                marginBottom: spacing.md 
              }}>
                What People Say About Me
              </h3>
              <p style={{ 
                fontSize: typography.body.fontSize,
                color: colors.textSecondary,
                textAlign: 'center',
                padding: spacing.md 
              }}>
                No reviews yet. Start conversations to get feedback!
              </p>
            </Card>

            {/* My Friends */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
                <Users className="w-4 h-4" style={{ color: colors.textSecondary }} />
                <h3 style={{ 
                  fontSize: typography.titleMD.fontSize,
                  fontWeight: typography.titleMD.fontWeight,
                  color: colors.textPrimary 
                }}>
                  My Friends
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
                {/* Inner Circle */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                    <p style={{ fontSize: typography.label.fontSize, color: colors.textSecondary }}>Inner Circle</p>
                    <span style={{ fontSize: typography.label.fontSize, color: colors.textMuted }}>0</span>
                  </div>
                  <p style={{ fontSize: typography.body.fontSize, color: colors.textSecondary }}>No inner circle members yet</p>
                </div>

                {/* Close Friends */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                    <p style={{ fontSize: typography.label.fontSize, color: colors.textSecondary }}>Close Friends</p>
                    <span style={{ fontSize: typography.label.fontSize, color: colors.textMuted }}>0</span>
                  </div>
                  <p style={{ fontSize: typography.body.fontSize, color: colors.textSecondary }}>No close friends yet</p>
                </div>

                {/* Community */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                    <p style={{ fontSize: typography.label.fontSize, color: colors.textSecondary }}>Community</p>
                    <span style={{ fontSize: typography.label.fontSize, color: colors.textMuted }}>{communityMembers.length}</span>
                  </div>
                  {communityMembers.length > 0 ? (
                    <div style={{ display: 'flex', gap: spacing.sm, overflowX: 'auto', paddingBottom: spacing.sm }}>
                      {communityMembers.map((member) => (
                        <motion.button
                          key={member.id}
                          whileTap={{ scale: 0.98 }}
                          transition={{ duration: motionConfig.duration.fast / 1000, ease: motionConfig.easing }}
                          onClick={() => router.push(`/chat/${member.id}`)}
                          style={{
                            padding: `${spacing.sm} ${spacing.md}`,
                            borderRadius: components.chip.radius,
                            background: colors.chipBg,
                            color: colors.chipText,
                            border: `1px solid ${colors.border}`,
                            fontSize: typography.label.fontSize,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {member.name}
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: typography.body.fontSize, color: colors.textSecondary }}>No community members yet</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Recent Chats */}
            <Card>
              <h3 style={{ 
                fontSize: typography.titleMD.fontSize,
                fontWeight: typography.titleMD.fontWeight,
                color: colors.textPrimary,
                marginBottom: spacing.md 
              }}>
                Recent Chats
              </h3>
              {loadingChats ? (
                <p style={{ fontSize: typography.body.fontSize, color: colors.textSecondary, textAlign: 'center', padding: spacing.md }}>
                  Loading...
                </p>
              ) : recentChats.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                  {recentChats.map((chat) => (
                    <motion.button
                      key={chat.id}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: motionConfig.duration.fast / 1000, ease: motionConfig.easing }}
                      onClick={() => router.push(`/chat/${chat.id}`)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                        padding: spacing.md,
                        background: components.input.background,
                        border: `1px solid ${components.input.border}`,
                        borderRadius: components.input.radius,
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{chat.emoji || "👤"}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: typography.body.fontSize, fontWeight: 500, color: colors.textPrimary }}>
                          {chat.name}
                        </p>
                        <p style={{ fontSize: typography.caption.fontSize, color: colors.textSecondary }}>
                          {chat.lastMessage || "No messages yet"}
                        </p>
                      </div>
                      <p style={{ fontSize: typography.caption.fontSize, color: colors.textMuted }}>
                        {chat.time}
                      </p>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: typography.body.fontSize, color: colors.textSecondary, textAlign: 'center', padding: spacing.md }}>
                  No recent chats
                </p>
              )}
            </Card>
          </div>
        </div>

        {/* Footer - Sign Out and Forgot Password */}
        <div 
          style={{
            padding: spacing.screen,
            paddingTop: spacing.lg,
            borderTop: `1px solid ${colors.border}`,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.sm,
          }}
        >
          <Button
            variant="secondary"
            onClick={async () => {
              await signOut()
              router.push("/")
            }}
            className="w-full"
          >
            Sign Out
          </Button>
          <Link href="/login" className="w-full">
            <Button variant="ghost" className="w-full">
              Forgot Password
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
