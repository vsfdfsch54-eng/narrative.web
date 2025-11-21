"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Message } from "@/lib/types"
import { Check, CheckCheck } from "lucide-react"
import { tokens } from "@/lib/design-tokens"

interface ChatBubbleProps {
  message: Message
  isOwn: boolean
}

function formatTime(timestamp: Date): string {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  return timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function ChatBubble({ message, isOwn }: ChatBubbleProps) {
  const time = formatTime(message.timestamp)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex w-full mb-3",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div
        style={{
          maxWidth: '75%',
          borderRadius: tokens.radii.pill,
          padding: `${tokens.spacing[10]} ${tokens.spacing[14]}`,
          background: isOwn ? tokens.colors.pillUnselected : tokens.colors.pillUnselected,
          boxShadow: tokens.shadows.pillUnselected,
          border: 'none',
        }}
      >
        <p style={{
          ...tokens.typography.body,
          color: tokens.colors.textOnPill,
          margin: 0,
          marginBottom: tokens.spacing[8],
        }}>
          {message.content}
        </p>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacing[8],
          fontSize: '12px',
          color: tokens.colors.textMuted,
        }}>
          <span>{time}</span>
          {isOwn && (
            <span>
              {message.read ? (
                <CheckCheck style={{ width: '12px', height: '12px' }} />
              ) : (
                <Check style={{ width: '12px', height: '12px' }} />
              )}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
