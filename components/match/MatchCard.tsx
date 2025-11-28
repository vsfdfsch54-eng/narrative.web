"use client"

import { motion } from "framer-motion"
import { tokens } from "@/lib/design-tokens"
import { Heart, X } from "lucide-react"

interface MatchCardProps {
  profile: {
    id: string
    name: string
    interests?: string[]
    mood?: string | null
    topic?: string | null
    reputation_emojis?: string[]
    communities?: any[]
    mutual_friends?: number
    mutual_communities?: number
  }
  onConnect: () => void
  onSkip: () => void
  style?: React.CSSProperties
}

export function MatchCard({ profile, onConnect, onSkip, style }: MatchCardProps) {
  const interests = Array.isArray(profile.interests) ? profile.interests : []
  const reputationEmojis = Array.isArray(profile.reputation_emojis) ? profile.reputation_emojis : []
  const mutualFriends = profile.mutual_friends || 0
  const mutualCommunities = profile.mutual_communities || 0

  return (
    <motion.div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '420px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        padding: tokens.spacing[28],
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Name */}
      <h2 style={{
        ...tokens.typography.heading,
        color: tokens.colors.textPrimaryOnDark,
        marginBottom: tokens.spacing[20],
        fontSize: '32px',
        fontWeight: 700,
        textAlign: 'center',
      }}>
        {profile.name}
      </h2>

      {/* 2x2 Grid of Info Boxes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: tokens.spacing[12],
        marginBottom: tokens.spacing[28],
        flex: 1,
      }}>
        {/* Box 1: Interests */}
        <div style={{
          padding: tokens.spacing[16],
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          backdropFilter: 'blur(10px)',
        }}>
          <h3 style={{
            ...tokens.typography.label,
            color: tokens.colors.textSecondary,
            marginBottom: tokens.spacing[10],
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: 600,
          }}>
            Interests
          </h3>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: tokens.spacing[8],
          }}>
            {interests.length > 0 ? (
              interests.slice(0, 3).map((interest, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: `${tokens.spacing[8]} ${tokens.spacing[10]}`,
                    borderRadius: '9999px',
                    background: 'rgba(255, 255, 255, 0.10)',
                    color: tokens.colors.textPrimaryOnDark,
                    fontSize: '11px',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {interest}
                </span>
              ))
            ) : (
              <span style={{
                color: tokens.colors.textMuted,
                fontSize: '12px',
              }}>
                None
              </span>
            )}
          </div>
        </div>

        {/* Box 2: Mood + Topic */}
        <div style={{
          padding: tokens.spacing[16],
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          backdropFilter: 'blur(10px)',
        }}>
          <h3 style={{
            ...tokens.typography.label,
            color: tokens.colors.textSecondary,
            marginBottom: tokens.spacing[10],
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: 600,
          }}>
            Mood & Topic
          </h3>
          <div style={{
            color: tokens.colors.textPrimaryOnDark,
            fontSize: '13px',
            lineHeight: 1.5,
          }}>
            {profile.mood && profile.topic ? (
              <div>
                <div style={{ marginBottom: tokens.spacing[4], fontWeight: 500 }}>{profile.mood}</div>
                <div style={{ color: tokens.colors.textSecondary, fontSize: '12px' }}>{profile.topic}</div>
              </div>
            ) : (
              <span style={{ color: tokens.colors.textMuted, fontSize: '12px' }}>None selected</span>
            )}
          </div>
        </div>

        {/* Box 3: Mutual Friends/Communities */}
        <div style={{
          padding: tokens.spacing[16],
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          backdropFilter: 'blur(10px)',
        }}>
          <h3 style={{
            ...tokens.typography.label,
            color: tokens.colors.textSecondary,
            marginBottom: tokens.spacing[10],
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: 600,
          }}>
            Connections
          </h3>
          <div style={{
            color: tokens.colors.textPrimaryOnDark,
            fontSize: '13px',
            fontWeight: 500,
          }}>
            {mutualFriends > 0 ? (
              <div>{mutualFriends} mutual friend{mutualFriends !== 1 ? 's' : ''}</div>
            ) : mutualCommunities > 0 ? (
              <div>{mutualCommunities} mutual communit{mutualCommunities !== 1 ? 'ies' : 'y'}</div>
            ) : (
              <span style={{ color: tokens.colors.textMuted, fontSize: '12px' }}>None</span>
            )}
          </div>
        </div>

        {/* Box 4: Reputation Emojis */}
        <div style={{
          padding: tokens.spacing[16],
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          backdropFilter: 'blur(10px)',
        }}>
          <h3 style={{
            ...tokens.typography.label,
            color: tokens.colors.textSecondary,
            marginBottom: tokens.spacing[10],
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: 600,
          }}>
            Reputation
          </h3>
          <div style={{
            display: 'flex',
            gap: tokens.spacing[8],
            fontSize: '24px',
            alignItems: 'center',
            minHeight: '24px',
          }}>
            {reputationEmojis.length > 0 ? (
              reputationEmojis.slice(0, 3).map((emoji, idx) => (
                <span key={idx}>{emoji}</span>
              ))
            ) : (
              <span style={{
                color: tokens.colors.textMuted,
                fontSize: '12px',
              }}>
                None
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: tokens.spacing[12],
        flexShrink: 0,
      }}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onSkip}
          style={{
            flex: 1,
            padding: `${tokens.spacing[16]} ${tokens.spacing[20]}`,
            borderRadius: '9999px',
            background: 'transparent',
            border: '1.5px solid rgba(255, 255, 255, 0.25)',
            color: tokens.colors.textPrimaryOnDark,
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: tokens.spacing[8],
            backdropFilter: 'blur(10px)',
          }}
        >
          <X style={{ width: '20px', height: '20px' }} />
          Skip
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onConnect}
          style={{
            flex: 1,
            padding: `${tokens.spacing[16]} ${tokens.spacing[20]}`,
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)',
            border: '1.5px solid rgba(255, 255, 255, 0.30)',
            color: tokens.colors.textPrimaryOnDark,
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: tokens.spacing[8],
            boxShadow: '0 0 20px rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Heart style={{ width: '20px', height: '20px' }} />
          Connect
        </motion.button>
      </div>
    </motion.div>
  )
}
