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
        maxWidth: '400px',
        margin: '0 auto',
        borderRadius: tokens.radii.button,
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.10)',
        padding: tokens.spacing[20],
        boxShadow: tokens.shadows.pillUnselected,
        ...style,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      {/* Name */}
      <h2 style={{
        ...tokens.typography.heading,
        color: tokens.colors.textPrimaryOnDark,
        marginBottom: tokens.spacing[20],
        fontSize: '28px',
        fontWeight: 600,
      }}>
        {profile.name}
      </h2>

      {/* 2x2 Grid of Info Boxes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: tokens.spacing[12],
        marginBottom: tokens.spacing[20],
      }}>
        {/* Box 1: Interests */}
        <div style={{
          padding: tokens.spacing[16],
          borderRadius: tokens.radii.button,
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <h3 style={{
            ...tokens.typography.label,
            color: tokens.colors.textSecondary,
            marginBottom: tokens.spacing[8],
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
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
                    padding: `${tokens.spacing[4]} ${tokens.spacing[8]}`,
                    borderRadius: tokens.radii.pill,
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: tokens.colors.textOnPill,
                    fontSize: '12px',
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
          borderRadius: tokens.radii.button,
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <h3 style={{
            ...tokens.typography.label,
            color: tokens.colors.textSecondary,
            marginBottom: tokens.spacing[8],
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Mood & Topic
          </h3>
          <div style={{
            color: tokens.colors.textPrimaryOnDark,
            fontSize: '14px',
          }}>
            {profile.mood && profile.topic ? (
              <div>
                <div style={{ marginBottom: tokens.spacing[4] }}>{profile.mood}</div>
                <div style={{ color: tokens.colors.textSecondary }}>{profile.topic}</div>
              </div>
            ) : (
              <span style={{ color: tokens.colors.textMuted }}>None selected</span>
            )}
          </div>
        </div>

        {/* Box 3: Mutual Friends/Communities */}
        <div style={{
          padding: tokens.spacing[16],
          borderRadius: tokens.radii.button,
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <h3 style={{
            ...tokens.typography.label,
            color: tokens.colors.textSecondary,
            marginBottom: tokens.spacing[8],
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Connections
          </h3>
          <div style={{
            color: tokens.colors.textPrimaryOnDark,
            fontSize: '14px',
          }}>
            {mutualFriends > 0 ? (
              <div>{mutualFriends} mutual friend{mutualFriends !== 1 ? 's' : ''}</div>
            ) : mutualCommunities > 0 ? (
              <div>{mutualCommunities} mutual communit{mutualCommunities !== 1 ? 'ies' : 'y'}</div>
            ) : (
              <span style={{ color: tokens.colors.textMuted }}>None</span>
            )}
          </div>
        </div>

        {/* Box 4: Reputation Emojis */}
        <div style={{
          padding: tokens.spacing[16],
          borderRadius: tokens.radii.button,
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <h3 style={{
            ...tokens.typography.label,
            color: tokens.colors.textSecondary,
            marginBottom: tokens.spacing[8],
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Reputation
          </h3>
          <div style={{
            display: 'flex',
            gap: tokens.spacing[8],
            fontSize: '20px',
          }}>
            {reputationEmojis.length > 0 ? (
              reputationEmojis.map((emoji, idx) => (
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
      }}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onSkip}
          style={{
            flex: 1,
            padding: tokens.spacing[14],
            borderRadius: tokens.radii.button,
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.20)',
            color: tokens.colors.textPrimaryOnDark,
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: tokens.spacing[8],
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
            padding: tokens.spacing[14],
            borderRadius: tokens.radii.button,
            background: tokens.colors.pillSelected,
            border: 'none',
            color: tokens.colors.textOnPill,
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: tokens.spacing[8],
          }}
        >
          <Heart style={{ width: '20px', height: '20px' }} />
          Connect
        </motion.button>
      </div>
    </motion.div>
  )
}

