"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Topic } from "@/lib/types"
import { TopicIcons, DefaultTopicIcon } from "./topic-icons"

interface TopicChipProps {
  topic: Topic
  selected?: boolean
  onClick?: () => void
  delay?: number
}

export function TopicChip({
  topic,
  selected = false,
  onClick,
  delay = 0,
}: TopicChipProps) {
  const icon = TopicIcons[topic.id] || DefaultTopicIcon
  
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay, duration: 0.2 }}
      whileTap={{ 
        scale: 0.97,
        transition: { duration: 0.1 }
      }}
      onClick={onClick}
      className={cn(
        "shrink-0 px-4 py-2.5 rounded-[14px]",
        "font-semibold text-base tracking-tight",
        "transition-all duration-300",
        "touch-manipulation",
        "overflow-hidden flex items-center gap-2",
        "relative",
        "min-h-[42px]",
        selected
          ? "text-[#0A0A0A] border border-[#0A0A0A]"
          : "text-[#0A0A0A]"
      )}
      style={{
        background: selected
          ? 'rgba(0,0,0,0.05)'
          : 'rgba(255,255,255,0.7)',
        border: selected
          ? '1px solid rgba(0,0,0,0.2)'
          : '1px solid rgba(0,0,0,0.08)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: selected
          ? '0 2px 8px rgba(0,0,0,0.12)'
          : '0 2px 8px rgba(0,0,0,0.08)',
        willChange: "transform"
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.8, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="flex-shrink-0"
        style={{ color: 'rgba(0,0,0,0.8)' }}
      >
        {icon}
      </motion.div>
      <span className="relative z-10 text-center leading-tight whitespace-nowrap">
        {topic.label}
      </span>
    </motion.button>
  )
}
