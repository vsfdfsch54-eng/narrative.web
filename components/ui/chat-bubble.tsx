"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Message } from "@/lib/types"
import { Check, CheckCheck } from "lucide-react"
import { tokens } from "@/lib/design-tokens"
import { MessageReactions } from "./message-reactions"
import { ImagePreview } from "./image-preview"
import { FilePreview } from "./file-preview"

interface ChatBubbleProps {
  message: Message
  isOwn: boolean
  currentUserId: string
  onReactionToggle?: (messageId: string, emoji: string) => void
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

export function ChatBubble({ message, isOwn, currentUserId, onReactionToggle }: ChatBubbleProps) {
  const time = formatTime(message.timestamp)
  const isRead = message.read || !!message.readAt

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
          background: isOwn ? tokens.colors.chatBubbleOwn : tokens.colors.chatBubbleOther,
          boxShadow: tokens.shadows.pillUnselected,
          border: 'none',
        }}
      >
        {/* Message content */}
        {message.messageType === 'image' && message.fileUrl ? (
          <ImagePreview url={message.fileUrl} fileName={message.fileName || undefined} />
        ) : message.messageType === 'file' && message.fileUrl ? (
          <FilePreview 
            url={message.fileUrl} 
            fileName={message.fileName || 'File'} 
            fileSize={message.fileSize || undefined}
          />
        ) : (
          <p style={{
            ...tokens.typography.body,
            color: isOwn ? tokens.colors.textOnPill : tokens.colors.textPrimaryOnDark,
            margin: 0,
            marginBottom: tokens.spacing[8],
          }}>
            {message.content}
          </p>
        )}

        {/* Reactions */}
        {message.reactions && Object.keys(message.reactions).length > 0 && onReactionToggle && (
          <MessageReactions
            messageId={message.id}
            reactions={message.reactions}
            currentUserId={currentUserId}
            onReactionToggle={(emoji) => onReactionToggle(message.id, emoji)}
          />
        )}

        {/* Timestamp and read receipt */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacing[8],
          fontSize: '12px',
          color: tokens.colors.textMuted,
          marginTop: tokens.spacing[8],
        }}>
          <span>{time}</span>
          {isOwn && (
            <span>
              {isRead ? (
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
