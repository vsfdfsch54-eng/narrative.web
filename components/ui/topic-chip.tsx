"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Topic } from "@/lib/types"
import { TopicIcons, TopicColors, brightenColor, DefaultTopicIcon } from "./topic-icons"

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
  const baseColor = TopicColors[topic.id] || '#A6A6A6'
  const iconColor = selected ? brightenColor(baseColor, 13) : baseColor
  
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
        "shrink-0 px-[14px] py-[10px] rounded-[14px]",
        "font-semibold text-base tracking-tight",
        "transition-all duration-300",
        "touch-manipulation",
        "overflow-hidden flex items-center gap-2",
        "relative",
        "text-white"
      )}
      style={{
        background: selected ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
        border: selected
          ? '1.5px solid rgba(255,255,255,0.3)'
          : '1px solid rgba(255,255,255,0.15)',
        boxShadow: selected 
          ? '0 1px 4px rgba(0,0,0,0.2)' 
          : 'none',
        willChange: "transform"
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="flex-shrink-0"
        style={{ color: iconColor }}
      >
        {icon}
      </motion.div>
      <span className="relative z-10 text-center leading-tight whitespace-nowrap">
        {topic.label}
      </span>
    </motion.button>
  )
}
