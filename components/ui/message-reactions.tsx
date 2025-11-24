"use client"

import { motion } from "framer-motion"
import { Smile, Plus } from "lucide-react"
import { useState } from "react"
import { tokens } from "@/lib/design-tokens"

interface MessageReactionsProps {
  messageId: string
  reactions: Record<string, string[]>
  currentUserId: string
  onReactionToggle: (emoji: string) => void
}

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥']

export function MessageReactions({
  messageId,
  reactions,
  currentUserId,
  onReactionToggle,
}: MessageReactionsProps) {
  const [showPicker, setShowPicker] = useState(false)

  const hasReactions = Object.keys(reactions).length > 0

  return (
    <div style={{ position: 'relative' }}>
      {/* Reaction buttons */}
      <div style={{
        display: 'flex',
        gap: tokens.spacing[4],
        alignItems: 'center',
        marginTop: tokens.spacing[4],
      }}>
        {Object.entries(reactions).map(([emoji, userIds]) => {
          const hasReacted = userIds.includes(currentUserId)
          return (
            <motion.button
              key={emoji}
              whileTap={{ scale: 0.9 }}
              onClick={() => onReactionToggle(emoji)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: tokens.spacing[4],
                padding: `4px ${tokens.spacing[8]}`,
                borderRadius: tokens.radii.pill,
                background: hasReacted ? tokens.colors.pillSelected : tokens.colors.pillUnselected,
                border: 'none',
                color: tokens.colors.textOnPill,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: tokens.shadows.pillUnselected,
              }}
            >
              <span>{emoji}</span>
              <span>{userIds.length}</span>
            </motion.button>
          )
        })}

        {/* Add reaction button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowPicker(!showPicker)}
          style={{
            padding: '4px',
            borderRadius: tokens.radii.pill,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            color: tokens.colors.textSecondary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
          }}
        >
          <Plus style={{ width: '12px', height: '12px' }} />
        </motion.button>
      </div>

      {/* Emoji picker */}
      {showPicker && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: tokens.spacing[8],
            padding: tokens.spacing[12],
            borderRadius: tokens.radii.input,
            background: tokens.colors.pillUnselected,
            boxShadow: tokens.shadows.pillUnselected,
            display: 'flex',
            gap: tokens.spacing[8],
            zIndex: 100,
          }}
        >
          {COMMON_EMOJIS.map((emoji) => (
            <motion.button
              key={emoji}
              whileTap={{ scale: 0.8 }}
              onClick={() => {
                onReactionToggle(emoji)
                setShowPicker(false)
              }}
              style={{
                fontSize: '20px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: tokens.spacing[4],
                borderRadius: tokens.radii.pill,
              }}
            >
              {emoji}
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  )
}

