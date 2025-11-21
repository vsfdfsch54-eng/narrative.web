"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Topic } from "@/lib/types"
import { TopicIcons, TopicColors, brightenColor, DefaultTopicIcon } from "./topic-icons"
import { components, motion as motionConfig } from "@/lib/design-system"

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
      transition={{ delay, duration: motionConfig.duration.normal / 1000, ease: motionConfig.easing }}
      whileTap={{ 
        scale: 0.98,
        transition: { duration: motionConfig.duration.fast / 1000, ease: motionConfig.easing }
      }}
      onClick={onClick}
      className={cn(
        "shrink-0",
        "font-medium text-[15px] tracking-tight",
        "transition-all duration-150 ease-in-out",
        "touch-manipulation",
        "overflow-hidden flex items-center",
        "relative",
        "text-black"
      )}
      style={{
        height: components.chip.height,
        borderRadius: components.chip.radius,
        padding: components.chip.padding,
        gap: components.chip.gap,
        background: selected ? components.chip.selected.background : components.chip.background,
        border: selected ? components.chip.selected.border : components.chip.unselected.border,
        boxShadow: selected ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
        willChange: "transform"
      }}
    >
      <div
        className="flex-shrink-0"
        style={{ 
          color: iconColor,
          width: components.chip.iconSize,
          height: components.chip.iconSize,
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
