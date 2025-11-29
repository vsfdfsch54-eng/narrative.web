"use client"

import { motion } from 'framer-motion'
import { useMatchmaking } from '@/context/MatchmakingContext'
import { tokensV2, animations } from '@/lib/design-tokens-v2'

const TOPICS = [
  { id: 'deep-talk', emoji: '🧠', label: 'Deep Talk' },
  { id: 'music', emoji: '🎵', label: 'Music' },
  { id: 'art', emoji: '🎨', label: 'Art' },
  { id: 'relationships', emoji: '❤️', label: 'Relationships' },
  { id: 'news', emoji: '🌍', label: 'News' },
]

export function TopicStep() {
  const { setTopic, context } = useMatchmaking()

  return (
    <motion.div
      {...animations.fadeUp}
      style={{
        padding: tokensV2.spacing[24],
        display: 'flex',
        flexDirection: 'column',
        gap: tokensV2.spacing[32],
      }}
    >
      <div>
        <h1 style={{
          fontSize: tokensV2.typography.fontSize['3xl'],
          fontWeight: tokensV2.typography.fontWeight.bold,
          color: tokensV2.colors.textPrimary,
          margin: 0,
          marginBottom: tokensV2.spacing[8],
        }}>
          Choose a Topic
        </h1>
        <p style={{
          fontSize: tokensV2.typography.fontSize.base,
          color: tokensV2.colors.textSecondary,
          margin: 0,
        }}>
          What do you want to talk about?
        </p>
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: tokensV2.spacing[12],
      }}>
        {TOPICS.map((topic) => (
          <motion.button
            key={topic.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTopic(topic.id)}
            style={{
              padding: `${tokensV2.spacing[16]} ${tokensV2.spacing[24]}`,
              borderRadius: tokensV2.borderRadius.full,
              border: `2px solid ${tokensV2.colors.borderLight}`,
              background: tokensV2.colors.backgroundWhite,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: tokensV2.spacing[8],
              boxShadow: tokensV2.shadows.small,
              transition: tokensV2.transitions.normal,
            }}
            whileHover={{
              scale: 1.05,
              boxShadow: tokensV2.shadows.medium,
            }}
          >
            <span style={{ fontSize: '24px' }}>{topic.emoji}</span>
            <span style={{
              fontSize: tokensV2.typography.fontSize.base,
              fontWeight: tokensV2.typography.fontWeight.medium,
              color: tokensV2.colors.textPrimary,
            }}>
              {topic.label}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

