"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Message } from "@/lib/types"
import { Check, CheckCheck } from "lucide-react"

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
        className={cn(
          "max-w-[75%] rounded-[20px] px-4 py-2.5",
          isOwn
            ? "bg-white text-black"
            : "bg-white/5 border border-white/10 text-white"
        )}
      >
        <p className={cn(
          "text-sm leading-relaxed",
          isOwn ? "text-black" : "text-white/90"
        )}>
          {message.content}
        </p>
        <div className={cn(
          "flex items-center gap-1.5 mt-1.5 text-xs",
          isOwn ? "text-black/60" : "text-white/50"
        )}>
          <span>{time}</span>
          {isOwn && (
            <span className="ml-1">
              {message.read ? (
                <CheckCheck className="h-3 w-3 text-black/60" />
              ) : (
                <Check className="h-3 w-3 text-black/60" />
              )}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
