"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useMatchmaking } from '@/context/MatchmakingContext'
import { useAuth } from '@/hooks/use-auth'
import { tokensV2, animations } from '@/lib/design-tokens-v2'

interface MatchProfile {
  id: string
  nickname: string
  mood: string
  intention: string
  topic: string
  compatibilityScore: number
  sharedTopics: string[]
}

export function PreviewStep() {
  const { context, setMatchedUserId, transitionTo } = useMatchmaking()
  const { user } = useAuth()
  const [profile, setProfile] = useState<MatchProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!context.matchSessionId || !user?.id) return

    // Fetch match profile
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/matchmaking-v2/session/${context.matchSessionId}`)
        const data = await response.json()

        if (data.success && data.profile) {
          setProfile(data.profile)
          setMatchedUserId(data.profile.id)
        }
      } catch (error) {
        console.error('[PreviewStep] Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [context.matchSessionId, user?.id, setMatchedUserId])

  useEffect(() => {
    // Auto-transition to ephemeral chat after 3 seconds
    if (profile && !loading) {
      const timer = setTimeout(() => {
        transitionTo('ephemeral_chat')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [profile, loading, transitionTo])

  if (loading || !profile) {
    return (
      <div style={{
        padding: tokensV2.spacing[24],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
      }}>
        <p>Loading match...</p>
      </div>
    )
  }

  return (
    <motion.div
      {...animations.fadeUp}
      style={{
        padding: tokensV2.spacing[24],
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: tokensV2.spacing[24],
      }}
    >
      {/* Blurred Profile Silhouette */}
      <div style={{
        width: '200px',
        height: '200px',
        borderRadius: tokensV2.borderRadius.full,
        background: 'linear-gradient(135deg, rgba(0, 79, 255, 0.2) 0%, rgba(109, 0, 255, 0.2) 100%)',
        filter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '64px',
        opacity: 0.6,
      }}>
        👤
      </div>

      {/* Nickname */}
      <h1 style={{
        fontSize: tokensV2.typography.fontSize['2xl'],
        fontWeight: tokensV2.typography.fontWeight.bold,
        color: tokensV2.colors.textPrimary,
        margin: 0,
      }}>
        {profile.nickname}
      </h1>

      {/* Compatibility Bars */}
      <div style={{
        width: '100%',
        maxWidth: '300px',
        display: 'flex',
        flexDirection: 'column',
        gap: tokensV2.spacing[12],
      }}>
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: tokensV2.spacing[4],
          }}>
            <span style={{
              fontSize: tokensV2.typography.fontSize.sm,
              color: tokensV2.colors.textSecondary,
            }}>
              Compatibility
            </span>
            <span style={{
              fontSize: tokensV2.typography.fontSize.sm,
              fontWeight: tokensV2.typography.fontWeight.semibold,
              color: tokensV2.colors.textPrimary,
            }}>
              {profile.compatibilityScore}%
            </span>
          </div>
          <div style={{
            height: '8px',
            borderRadius: tokensV2.borderRadius.full,
            background: tokensV2.colors.borderLight,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${profile.compatibilityScore}%`,
              background: tokensV2.gradients.primary,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Shared Topics */}
      {profile.sharedTopics.length > 0 && (
        <div style={{
          width: '100%',
          maxWidth: '300px',
        }}>
          <p style={{
            fontSize: tokensV2.typography.fontSize.sm,
            color: tokensV2.colors.textSecondary,
            margin: 0,
            marginBottom: tokensV2.spacing[8],
          }}>
            Shared interests:
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: tokensV2.spacing[8],
          }}>
            {profile.sharedTopics.map((topic) => (
              <span
                key={topic}
                style={{
                  padding: `${tokensV2.spacing[4]} ${tokensV2.spacing[12]}`,
                  borderRadius: tokensV2.borderRadius.full,
                  background: tokensV2.gradients.subtle,
                  fontSize: tokensV2.typography.fontSize.sm,
                  color: tokensV2.colors.textPrimary,
                }}
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      <p style={{
        fontSize: tokensV2.typography.fontSize.sm,
        color: tokensV2.colors.textSecondary,
        margin: 0,
        textAlign: 'center',
      }}>
        Starting conversation...
      </p>
    </motion.div>
  )
}

