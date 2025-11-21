"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Topic } from "@/lib/types"
import { TopicIcons, TopicColors, brightenColor, DefaultTopicIcon } from "./topic-icons"
import { tokens } from "@/lib/design-tokens"

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
  const baseColor = TopicColors[topic.id] || tokens.colors.accentBlue
  const iconColor = selected ? brightenColor(baseColor, 12) : baseColor
  
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay, duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      whileTap={{ 
        scale: 0.98,
        transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] }
      }}
      onClick={onClick}
      className={cn(
        "shrink-0",
        "transition-all duration-150 ease-in-out",
        "touch-manipulation",
        "overflow-hidden flex items-center",
        "relative"
      )}
      style={{
        height: '46px',
        borderRadius: tokens.radii.pill,
        padding: `0 ${tokens.spacing[20]}`,
        gap: tokens.spacing[12],
        background: tokens.colors.surfacePrimary,
        color: tokens.colors.textPrimary,
        border: 'none',
        ...tokens.typography.label,
        willChange: "transform"
      }}
    >
      <div
        className="flex-shrink-0"
        style={{ 
          color: iconColor,
          width: '18px',
          height: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {icon}
      </div>
      <span className="relative z-10 text-center leading-tight whitespace-nowrap">
        {topic.label}
      </span>
    </motion.button>
  )
}
