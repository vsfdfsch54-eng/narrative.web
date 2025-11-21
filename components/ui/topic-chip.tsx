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
  const baseColor = TopicColors[topic.id] || '#A6A6A6'
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
        "font-medium text-[15px] tracking-tight",
        "transition-all duration-150 ease-in-out",
        "touch-manipulation",
        "overflow-hidden flex items-center",
        "relative",
        selected ? "text-white" : "text-black"
      )}
      style={{
        height: '44px',
        borderRadius: tokens.radii.button,
        padding: `${tokens.spacing[12]} ${tokens.spacing[16]}`,
        gap: tokens.spacing[12],
        background: selected ? tokens.colors.accentPrimary : tokens.colors.surfaceCard,
        color: selected ? '#FFFFFF' : tokens.colors.textPrimary,
        border: selected ? 'none' : `1px solid ${tokens.colors.borderSubtle}`,
        boxShadow: selected ? tokens.shadows.card : 'none',
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
