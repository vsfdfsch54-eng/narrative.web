"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/AppShell"
import { tokens } from "@/lib/design-tokens"
import { checkOnboardingStatus } from "@/lib/user-helpers"
import { VIBES } from "@/lib/constants"
import { Loader2 } from "lucide-react"

const DAILY_VIBES = [
  { id: 'chill', label: 'Chill', emoji: '😊' },
  { id: 'motivated', label: 'Motivated', emoji: '🔥' },
  { id: 'low', label: 'Low', emoji: '😔' },
  { id: 'focused', label: 'Focused', emoji: '🧠' },
  { id: 'emotional', label: 'Emotional', emoji: '😭' },
  { id: 'frustrated', label: 'Frustrated', emoji: '😤' },
  { id: 'excited', label: 'Excited', emoji: '🎉' },
  { id: 'calm', label: 'Calm', emoji: '🧘' },
]

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [userName, setUserName] = useState("")
  const [reputationEmojis, setReputationEmojis] = useState<string[]>([])
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showVibeWarning, setShowVibeWarning] = useState(false)

  // Routing guard
  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.replace("/")
      return
    }

    async function checkOnboarding() {
      if (!user) return
      
      try {
        const { completed, step, apiError } = await checkOnboardingStatus(user.id)

        if (apiError) {
          console.warn('[ProfilePage] ⚠️ API error checking onboarding - allowing access')
          return
        }

        if (!completed) {
          const redirectPath = `/onboarding?step=${step}`
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
          if (currentPath === redirectPath) {
            console.warn('[ProfilePage] ⚠️ Already on target path, skipping redirect')
            return
          }
          router.replace(redirectPath)
          return
        }
      } catch (error) {
        console.error('[ProfilePage] Error checking onboarding:', error)
      }
    }

    checkOnboarding()
  }, [user, authLoading, router])

  // Load profile data
  useEffect(() => {
    if (!user?.id) return

    async function loadProfile() {
      if (!user) return // Additional check for TypeScript
      
      try {
        setLoading(true)
        const response = await fetch(`/api/users?userId=${user.id}`)
        const data = await response.json()
        
        if (data.success && data.data) {
          setUserName(data.data.name || user.email?.split('@')[0] || 'User')
          setReputationEmojis(Array.isArray(data.data.reputation_emojis) ? data.data.reputation_emojis : [])
          setSelectedVibe(data.data.vibe || null)
        } else {
          setUserName(user.email?.split('@')[0] || 'User')
        }
      } catch (error) {
        console.error('[ProfilePage] Error loading profile:', error)
        if (user) {
          setUserName(user.email?.split('@')[0] || 'User')
        }
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user])

  // Prevent navigation if no vibe selected
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!selectedVibe) {
        e.preventDefault()
        e.returnValue = ''
        setShowVibeWarning(true)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [selectedVibe])

  const handleVibeSelect = async (vibeId: string) => {
    if (!user?.id) return

    setSaving(true)
    try {
      const vibe = DAILY_VIBES.find(v => v.id === vibeId)
      if (!vibe) return

      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          vibe: vibe.label,
        }),
      })

      if (response.ok) {
        setSelectedVibe(vibeId)
        setShowVibeWarning(false)
      } else {
        alert('Failed to save vibe. Please try again.')
      }
    } catch (error) {
      console.error('[ProfilePage] Error saving vibe:', error)
      alert('Failed to save vibe. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <AppShell>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: tokens.spacing[20],
        }}>
          <Loader2 style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite' }} />
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
        minHeight: '100vh',
        padding: `${tokens.spacing[20]} ${tokens.layout.paddingHorizontal}`,
        paddingBottom: '120px',
      }}>
        {/* Header: Name and Reputation */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: tokens.spacing[16],
          marginBottom: tokens.spacing[32],
          textAlign: 'center',
        }}>
          <h1 style={{
            ...tokens.typography.title,
            color: tokens.colors.textPrimaryOnDark,
            margin: 0,
            fontSize: '28px',
          }}>
            {userName}
          </h1>

          {reputationEmojis.length > 0 && (
            <div style={{
              display: 'flex',
              gap: tokens.spacing[8],
              fontSize: '24px',
            }}>
              {reputationEmojis.map((emoji, idx) => (
                <span key={idx}>{emoji}</span>
              ))}
            </div>
          )}

          {/* Basic Stats (optional) */}
          <div style={{
            display: 'flex',
            gap: tokens.spacing[20],
            fontSize: '14px',
            color: tokens.colors.textSecondary,
          }}>
            <span>Chats: 0</span>
            <span>Community: 0</span>
          </div>
        </div>

        {/* Main: Choose your vibe for the day */}
        <div style={{
          marginBottom: tokens.spacing[32],
        }}>
          <h2 style={{
            ...tokens.typography.heading,
            color: tokens.colors.textPrimaryOnDark,
            marginBottom: tokens.spacing[16],
            textAlign: 'center',
          }}>
            Choose your vibe for the day
          </h2>

          {showVibeWarning && (
            <div style={{
              padding: tokens.spacing[12],
              borderRadius: tokens.radii.button,
              background: 'rgba(255, 200, 0, 0.1)',
              border: '1px solid rgba(255, 200, 0, 0.3)',
              color: tokens.colors.textPrimaryOnDark,
              marginBottom: tokens.spacing[16],
              textAlign: 'center',
              fontSize: '13px',
            }}>
              Please select a vibe before leaving
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: tokens.spacing[12],
          }}>
            {DAILY_VIBES.map((vibe) => (
              <motion.button
                key={vibe.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleVibeSelect(vibe.id)}
                disabled={saving}
                style={{
                  padding: tokens.spacing[16],
                  borderRadius: tokens.radii.button,
                  background: selectedVibe === vibe.id
                    ? 'rgba(255, 255, 255, 0.10)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: selectedVibe === vibe.id
                    ? '2px solid rgba(255, 255, 255, 0.20)'
                    : '1px solid rgba(255, 255, 255, 0.10)',
                  color: tokens.colors.textPrimaryOnDark,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.5 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: tokens.spacing[8],
                }}
              >
                <span style={{ fontSize: '32px' }}>{vibe.emoji}</span>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 500,
                }}>
                  {vibe.label}
                </span>
                {selectedVibe === vibe.id && (
                  <span style={{
                    fontSize: '12px',
                    color: tokens.colors.textSecondary,
                  }}>
                    Selected
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
