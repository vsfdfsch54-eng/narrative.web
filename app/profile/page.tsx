"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Save, Users, Edit2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/AppShell"
import { Button } from "@/components/ui/button"
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.layout.verticalSpacingLarge, paddingBottom: '120px' }}>
        <div style={{ textAlign: 'center', padding: tokens.layout.verticalSpacingLarge, borderRadius: tokens.radii.pill, background: tokens.colors.surfacePrimary }}>
          <div style={{ fontSize: '64px', marginBottom: tokens.layout.verticalSpacingMedium }}>👤</div>
          {isEditingName ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: tokens.spacing[12] }}>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                style={{
                  ...tokens.typography.heading,
                  color: tokens.colors.textPrimary,
                  background: tokens.colors.surfacePrimary,
                  border: 'none',
                  borderRadius: tokens.radii.input,
                  padding: `${tokens.spacing[12]} ${tokens.spacing[20]}`,
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
                ...tokens.typography.heading,
                color: tokens.colors.textPrimary,
                margin: 0,
              }}>
                {userName || "User"}
              </h2>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsEditingName(true)}
                style={{
                  padding: tokens.spacing[8],
                  borderRadius: tokens.radii.button,
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
          <div style={{ marginTop: tokens.layout.verticalSpacingLarge }}>
            <textarea
              value={quoteOfDay}
              onChange={(e) => setQuoteOfDay(e.target.value)}
              onBlur={handleSaveQuote}
              placeholder="What's on your mind today?"
              style={{
                width: '100%',
                minHeight: '80px',
                padding: `${tokens.spacing[12]} ${tokens.spacing[20]}`,
                background: tokens.colors.surfacePrimary,
                border: 'none',
                borderRadius: tokens.radii.input,
                color: tokens.colors.textPrimary,
                ...tokens.typography.body,
                resize: 'none',
              }}
              rows={3}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: tokens.spacing[16] }}>
              <Button
                variant="primary"
                onClick={handleSaveQuote}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div style={{ padding: tokens.layout.verticalSpacingMedium, borderRadius: tokens.radii.pill, background: tokens.colors.surfacePrimary }}>
          <h2 style={{ 
            ...tokens.typography.heading,
            color: tokens.colors.textPrimary,
            margin: 0,
            marginBottom: tokens.layout.verticalSpacingMedium,
          }}>
            My Friends
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.layout.verticalSpacingMedium }}>
            <div style={{ padding: tokens.spacing[16] }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing[8] }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[12] }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: tokens.colors.accentOrange }} />
                  <p style={{ ...tokens.typography.label, color: tokens.colors.textPrimary, fontWeight: 500, margin: 0 }}>Inner Circle</p>
                </div>
                <span style={{ ...tokens.typography.label, color: tokens.colors.textMuted }}>0</span>
              </div>
              <p style={{ ...tokens.typography.body, color: tokens.colors.textMuted, margin: 0, fontSize: tokens.typography.label.fontSize }}>No inner circle members yet</p>
            </div>

            <div style={{ padding: tokens.spacing[16] }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing[8] }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[12] }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: tokens.colors.accentBlue }} />
                  <p style={{ ...tokens.typography.label, color: tokens.colors.textPrimary, fontWeight: 500, margin: 0 }}>Close Friends</p>
                </div>
                <span style={{ ...tokens.typography.label, color: tokens.colors.textMuted }}>0</span>
              </div>
              <p style={{ ...tokens.typography.body, color: tokens.colors.textMuted, margin: 0, fontSize: tokens.typography.label.fontSize }}>No close friends yet</p>
            </div>

            <div style={{ padding: tokens.spacing[16] }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing[8] }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[12] }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: tokens.colors.accentGreen }} />
                  <p style={{ ...tokens.typography.label, color: tokens.colors.textPrimary, fontWeight: 500, margin: 0 }}>Community</p>
                </div>
                <span style={{ ...tokens.typography.label, color: tokens.colors.textMuted }}>{communityMembers.length}</span>
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
                        borderRadius: tokens.radii.pill,
                        background: tokens.colors.surfacePrimary,
                        color: tokens.colors.textPrimary,
                        border: 'none',
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
                <p style={{ ...tokens.typography.body, color: tokens.colors.textMuted, margin: 0, fontSize: tokens.typography.label.fontSize }}>No community members yet</p>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: tokens.layout.verticalSpacingMedium, borderRadius: tokens.radii.pill, background: tokens.colors.surfacePrimary }}>
          <h2 style={{ 
            ...tokens.typography.heading,
            color: tokens.colors.textPrimary,
            margin: 0,
            marginBottom: tokens.layout.verticalSpacingMedium,
          }}>
            Recent Chats
          </h2>
          {loadingChats ? (
            <p style={{ ...tokens.typography.body, color: tokens.colors.textMuted, textAlign: 'center', padding: tokens.layout.verticalSpacingLarge }}>
              Loading...
            </p>
          ) : recentChats.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[16] }}>
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
                    background: tokens.colors.surfacePrimary,
                    border: 'none',
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
                    <p style={{ ...tokens.typography.label, color: tokens.colors.textMuted, margin: 0 }}>
                      {chat.lastMessage || "No messages yet"}
                    </p>
                  </div>
                  <p style={{ ...tokens.typography.label, color: tokens.colors.textMuted, margin: 0 }}>
                    {chat.time}
                  </p>
                </motion.button>
              ))}
            </div>
          ) : (
            <p style={{ ...tokens.typography.body, color: tokens.colors.textMuted, textAlign: 'center', padding: tokens.layout.verticalSpacingLarge }}>
              No recent chats
            </p>
          )}
        </div>

        <div style={{ marginTop: tokens.layout.verticalSpacingMedium }}>
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
