"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/use-auth'
import { NavbarV2 } from '@/components/ui/navbar-v2'
import { tokensV2, animations } from '@/lib/design-tokens-v2'
import { checkV2UserStatus } from '@/lib/user-helpers-v2'
import { Edit2, LogOut, Settings } from 'lucide-react'

const MOODS = [
  { id: 'chill', label: 'Chill', emoji: '😊' },
  { id: 'motivated', label: 'Motivated', emoji: '😤' },
  { id: 'low', label: 'Low', emoji: '😔' },
  { id: 'focused', label: 'Focused', emoji: '🤓' },
  { id: 'playful', label: 'Playful', emoji: '😂' },
  { id: 'frustrated', label: 'Frustrated', emoji: '😡' },
  { id: 'emotional', label: 'Emotional', emoji: '😭' },
  { id: 'calm', label: 'Calm', emoji: '🧊' },
]

export default function ProfileV2Page() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // Routing guard
  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.replace('/onboarding-v2')
      return
    }

    const checkStatus = async () => {
      const status = await checkV2UserStatus(user.id)
      if (status.needsOnboarding) {
        router.replace('/onboarding-v2')
      }
    }

    checkStatus()
  }, [user, authLoading, router])

  // Load profile
  useEffect(() => {
    if (!user?.id) return

    const loadProfile = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/users?userId=${user.id}`)
        const data = await response.json()

        if (data.success && data.data) {
          setProfile(data.data)
          setSelectedMood(data.data.mood || null)
        }
      } catch (error) {
        console.error('[ProfileV2Page] Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user?.id])

  const handleSaveMood = async () => {
    if (!user?.id || !selectedMood || saving) return

    try {
      setSaving(true)
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          mood: selectedMood,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setProfile((prev: any) => ({ ...prev, mood: selectedMood }))
      }
    } catch (error) {
      console.error('[ProfileV2Page] Error saving mood:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.replace('/onboarding-v2')
  }

  if (authLoading || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: tokensV2.colors.backgroundEggshell,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ color: tokensV2.colors.textSecondary }}>Loading...</p>
      </div>
    )
  }

  const displayName = profile?.nickname || profile?.name || user?.email?.split('@')[0] || 'User'

  return (
    <div style={{
      minHeight: '100vh',
      background: tokensV2.colors.backgroundEggshell,
      paddingBottom: '80px',
    }}>
      {/* Header */}
      <div style={{
        background: tokensV2.gradients.primary,
        padding: `${tokensV2.spacing[32]} ${tokensV2.spacing[24]}`,
        color: tokensV2.colors.textOnDark,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h1 style={{
            fontSize: tokensV2.typography.fontSize['3xl'],
            fontWeight: tokensV2.typography.fontWeight.bold,
            margin: 0,
          }}>
            Profile
          </h1>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSignOut}
            style={{
              padding: tokensV2.spacing[12],
              borderRadius: tokensV2.borderRadius.full,
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LogOut size={20} color={tokensV2.colors.textOnDark} />
          </motion.button>
        </div>
      </div>

      {/* Profile Content */}
      <div style={{
        padding: tokensV2.spacing[24],
        display: 'flex',
        flexDirection: 'column',
        gap: tokensV2.spacing[24],
      }}>
        {/* Profile Card */}
        <motion.div
          {...animations.fadeUp}
          style={{
            padding: tokensV2.spacing[24],
            borderRadius: tokensV2.borderRadius.medium,
            background: tokensV2.colors.backgroundWhite,
            boxShadow: tokensV2.shadows.small,
            textAlign: 'center',
          }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: tokensV2.borderRadius.full,
            background: tokensV2.gradients.primary,
            margin: '0 auto',
            marginBottom: tokensV2.spacing[16],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            color: tokensV2.colors.textOnDark,
          }}>
            {displayName[0]?.toUpperCase() || 'U'}
          </div>
          <h2 style={{
            fontSize: tokensV2.typography.fontSize['2xl'],
            fontWeight: tokensV2.typography.fontWeight.bold,
            color: tokensV2.colors.textPrimary,
            margin: 0,
            marginBottom: tokensV2.spacing[4],
          }}>
            {displayName}
          </h2>
          {user?.email && (
            <p style={{
              fontSize: tokensV2.typography.fontSize.sm,
              color: tokensV2.colors.textSecondary,
              margin: 0,
            }}>
              {user.email}
            </p>
          )}
        </motion.div>

        {/* Mood Selection */}
        <motion.div
          {...animations.fadeUp}
          style={{
            padding: tokensV2.spacing[24],
            borderRadius: tokensV2.borderRadius.medium,
            background: tokensV2.colors.backgroundWhite,
            boxShadow: tokensV2.shadows.small,
          }}
        >
          <h3 style={{
            fontSize: tokensV2.typography.fontSize.xl,
            fontWeight: tokensV2.typography.fontWeight.semibold,
            color: tokensV2.colors.textPrimary,
            margin: 0,
            marginBottom: tokensV2.spacing[16],
          }}>
            Your Mood Today
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: tokensV2.spacing[12],
            marginBottom: tokensV2.spacing[16],
          }}>
            {MOODS.map((mood) => (
              <motion.button
                key={mood.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedMood(mood.id)}
                style={{
                  padding: tokensV2.spacing[16],
                  borderRadius: tokensV2.borderRadius.medium,
                  border: `2px solid ${selectedMood === mood.id ? tokensV2.colors.gradientStart : tokensV2.colors.borderLight}`,
                  background: selectedMood === mood.id 
                    ? tokensV2.gradients.subtle 
                    : tokensV2.colors.backgroundEggshell,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: tokensV2.spacing[8],
                  boxShadow: selectedMood === mood.id ? tokensV2.shadows.small : 'none',
                }}
              >
                <span style={{ fontSize: '24px' }}>{mood.emoji}</span>
                <span style={{
                  fontSize: tokensV2.typography.fontSize.xs,
                  fontWeight: tokensV2.typography.fontWeight.medium,
                  color: tokensV2.colors.textPrimary,
                }}>
                  {mood.label}
                </span>
              </motion.button>
            ))}
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSaveMood}
            disabled={!selectedMood || saving || selectedMood === profile?.mood}
            style={{
              width: '100%',
              padding: tokensV2.spacing[16],
              borderRadius: tokensV2.borderRadius.medium,
              background: selectedMood && selectedMood !== profile?.mood
                ? tokensV2.gradients.primary
                : tokensV2.colors.borderLight,
              color: selectedMood && selectedMood !== profile?.mood
                ? tokensV2.colors.textOnDark
                : tokensV2.colors.textMuted,
              border: 'none',
              cursor: selectedMood && selectedMood !== profile?.mood ? 'pointer' : 'not-allowed',
              fontSize: tokensV2.typography.fontSize.base,
              fontWeight: tokensV2.typography.fontWeight.semibold,
              opacity: selectedMood && selectedMood !== profile?.mood ? 1 : 0.5,
            }}
          >
            {saving ? 'Saving...' : selectedMood === profile?.mood ? 'Current Mood' : 'Save Mood'}
          </motion.button>
        </motion.div>

        {/* Interests */}
        {profile?.interests && Array.isArray(profile.interests) && profile.interests.length > 0 && (
          <motion.div
            {...animations.fadeUp}
            style={{
              padding: tokensV2.spacing[24],
              borderRadius: tokensV2.borderRadius.medium,
              background: tokensV2.colors.backgroundWhite,
              boxShadow: tokensV2.shadows.small,
            }}
          >
            <h3 style={{
              fontSize: tokensV2.typography.fontSize.xl,
              fontWeight: tokensV2.typography.fontWeight.semibold,
              color: tokensV2.colors.textPrimary,
              margin: 0,
              marginBottom: tokensV2.spacing[16],
            }}>
              Interests
            </h3>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: tokensV2.spacing[8],
            }}>
              {profile.interests.map((interest: string, index: number) => (
                <span
                  key={index}
                  style={{
                    padding: `${tokensV2.spacing[8]} ${tokensV2.spacing[16]}`,
                    borderRadius: tokensV2.borderRadius.full,
                    background: tokensV2.gradients.subtle,
                    fontSize: tokensV2.typography.fontSize.sm,
                    color: tokensV2.colors.textPrimary,
                  }}
                >
                  {interest}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <NavbarV2 />
    </div>
  )
}

