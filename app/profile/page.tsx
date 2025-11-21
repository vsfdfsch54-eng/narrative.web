"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Save, Users, Edit2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/AppShell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/components/ui/section-header"
import { tokens } from "@/lib/design-tokens"

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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
    }
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[24] }}>
        {/* User Identity Card */}
        <Card style={{ textAlign: 'center', padding: tokens.spacing[32] }}>
          <div style={{ fontSize: '64px', marginBottom: tokens.spacing[16] }}>👤</div>
          {isEditingName ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: tokens.spacing[12] }}>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                style={{
                  ...tokens.typography.headingM,
                  color: tokens.colors.textPrimary,
                  background: tokens.colors.surfaceCard,
                  border: `1px solid ${tokens.colors.borderSubtle}`,
                  borderRadius: tokens.radii.input,
                  padding: `${tokens.spacing[8]} ${tokens.spacing[16]}`,
                  textAlign: 'center',
                  width: '200px',
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
              <h2 style={{ 
                ...tokens.typography.headingM,
                color: tokens.colors.textPrimary,
                margin: 0,
              }}>
                {userName || "User"}
              </h2>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsEditingName(true)}
                style={{
                  padding: tokens.spacing[4],
                  borderRadius: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: tokens.colors.textMuted,
                  cursor: 'pointer',
                }}
              >
                <Edit2 className="w-4 h-4" />
              </motion.button>
            </div>
          )}
          <div style={{ marginTop: tokens.spacing[24] }}>
            <textarea
              value={quoteOfDay}
              onChange={(e) => setQuoteOfDay(e.target.value)}
              onBlur={handleSaveQuote}
              placeholder="What's on your mind today?"
              style={{
                width: '100%',
                minHeight: '80px',
                padding: tokens.spacing[16],
                background: tokens.colors.backgroundApp,
                border: `1px solid ${tokens.colors.borderSubtle}`,
                borderRadius: tokens.radii.input,
                color: tokens.colors.textPrimary,
                ...tokens.typography.body,
                resize: 'none',
              }}
              rows={3}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: tokens.spacing[12] }}>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveQuote}
                style={{
                  padding: `${tokens.spacing[8]} ${tokens.spacing[16]}`,
                  borderRadius: tokens.radii.button,
                  background: tokens.colors.accentPrimary,
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Save className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </Card>

        {/* My Friends Card */}
        <Card>
          <SectionHeader title="My Friends" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[20] }}>
            <div style={{ 
              padding: tokens.spacing[16],
              borderBottom: `1px solid ${tokens.colors.borderSubtle}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing[8] }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[12] }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: tokens.colors.accentWarning }} />
                  <p style={{ ...tokens.typography.caption, color: tokens.colors.textPrimary, fontWeight: 500, margin: 0 }}>Inner Circle</p>
                </div>
                <span style={{ ...tokens.typography.caption, color: tokens.colors.textMuted }}>0</span>
              </div>
              <p style={{ ...tokens.typography.body, color: tokens.colors.textSecondary, margin: 0, fontSize: tokens.typography.caption.fontSize }}>No inner circle members yet</p>
            </div>

            <div style={{ 
              padding: tokens.spacing[16],
              borderBottom: `1px solid ${tokens.colors.borderSubtle}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing[8] }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[12] }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: tokens.colors.accentPrimary }} />
                  <p style={{ ...tokens.typography.caption, color: tokens.colors.textPrimary, fontWeight: 500, margin: 0 }}>Close Friends</p>
                </div>
                <span style={{ ...tokens.typography.caption, color: tokens.colors.textMuted }}>0</span>
              </div>
              <p style={{ ...tokens.typography.body, color: tokens.colors.textSecondary, margin: 0, fontSize: tokens.typography.caption.fontSize }}>No close friends yet</p>
            </div>

            <div style={{ padding: tokens.spacing[16] }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing[8] }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[12] }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: tokens.colors.accentSuccess }} />
                  <p style={{ ...tokens.typography.caption, color: tokens.colors.textPrimary, fontWeight: 500, margin: 0 }}>Community</p>
                </div>
                <span style={{ ...tokens.typography.caption, color: tokens.colors.textMuted }}>{communityMembers.length}</span>
              </div>
              {communityMembers.length > 0 ? (
                <div style={{ display: 'flex', gap: tokens.spacing[12], overflowX: 'auto', paddingBottom: tokens.spacing[8] }}>
                  {communityMembers.map((member) => (
                    <motion.button
                      key={member.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push(`/chat/${member.id}`)}
                      style={{
                        padding: `${tokens.spacing[8]} ${tokens.spacing[16]}`,
                        borderRadius: tokens.radii.button,
                        background: tokens.colors.surfaceCard,
                        color: tokens.colors.textPrimary,
                        border: `1px solid ${tokens.colors.borderSubtle}`,
                        ...tokens.typography.caption,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                      }}
                    >
                      {member.name}
                    </motion.button>
                  ))}
                </div>
              ) : (
                <p style={{ ...tokens.typography.body, color: tokens.colors.textSecondary, margin: 0, fontSize: tokens.typography.caption.fontSize }}>No community members yet</p>
              )}
            </div>
          </div>
        </Card>

        {/* Recent Chats Card */}
        <Card>
          <SectionHeader title="Recent Chats" />
          {loadingChats ? (
            <p style={{ ...tokens.typography.body, color: tokens.colors.textSecondary, textAlign: 'center', padding: tokens.spacing[24] }}>
              Loading...
            </p>
          ) : recentChats.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[12] }}>
              {recentChats.map((chat) => (
                <motion.button
                  key={chat.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/chat/${chat.id}`)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: tokens.spacing[16],
                    padding: tokens.spacing[16],
                    background: tokens.colors.backgroundApp,
                    border: `1px solid ${tokens.colors.borderSubtle}`,
                    borderRadius: tokens.radii.input,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: '24px' }}>{chat.emoji || "👤"}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ ...tokens.typography.body, fontWeight: 500, color: tokens.colors.textPrimary, margin: 0 }}>
                      {chat.name}
                    </p>
                    <p style={{ ...tokens.typography.caption, color: tokens.colors.textSecondary, margin: 0 }}>
                      {chat.lastMessage || "No messages yet"}
                    </p>
                  </div>
                  <p style={{ ...tokens.typography.caption, color: tokens.colors.textMuted, margin: 0 }}>
                    {chat.time}
                  </p>
                </motion.button>
              ))}
            </div>
          ) : (
            <p style={{ ...tokens.typography.body, color: tokens.colors.textSecondary, textAlign: 'center', padding: tokens.spacing[24] }}>
              No recent chats
            </p>
          )}
        </Card>

        {/* Sign Out Button */}
        <div style={{ marginTop: tokens.spacing[24] }}>
          <Button
            variant="secondary"
            onClick={async () => {
              await signOut()
              router.push("/")
            }}
            style={{ width: '100%' }}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
