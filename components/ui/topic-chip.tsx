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
      animate={{ 
        opacity: 1,
        scale: selected ? 1.06 : 1,
        backgroundColor: selected ? tokens.colors.pillSelected : tokens.colors.pillUnselected,
      }}
      exit={{ opacity: 0 }}
      transition={{ 
        delay,
        transform: { duration: 0.14, ease: 'easeOut' },
        backgroundColor: { duration: 0.18, ease: 'easeOut' },
      }}
      whileTap={{ 
        scale: selected ? 1.06 : 0.98,
        transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] }
      }}
      onClick={onClick}
      className={cn(
        "shrink-0",
        "touch-manipulation",
        "inline-flex items-center",
        "relative"
      )}
      style={{
        borderRadius: tokens.radii.pill,
        padding: '8px 14px',
        gap: '10px',
        border: 'none',
        boxShadow: selected ? tokens.shadows.pillSelected : tokens.shadows.pillUnselected,
        fontSize: '14px',
        fontWeight: 400,
        letterSpacing: '0',
        color: tokens.colors.textOnPill,
        willChange: "transform, background-color"
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
