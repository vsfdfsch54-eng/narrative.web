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
  const iconColor = selected ? brightenColor(baseColor, 12) : baseColor
  
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay, duration: 0.15, ease: "easeInOut" }}
      whileTap={{ 
        scale: 0.98,
        transition: { duration: 0.12, ease: "easeInOut" }
      }}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-[12px]",
        "font-medium text-[15px] tracking-tight",
        "transition-all duration-150 ease-in-out",
        "touch-manipulation",
        "overflow-hidden flex items-center gap-2",
        "relative",
        "text-black"
      )}
      style={{
        height: '42px',
        padding: '10px 12px',
        background: selected ? '#F2F2F2' : '#FFFFFF',
        border: selected
          ? '1.75px solid #000000'
          : '1.25px solid rgba(255,255,255,0.12)',
        boxShadow: selected 
          ? '0 1px 3px rgba(0,0,0,0.15)' 
          : 'none',
        willChange: "transform"
      }}
    >
      <div
        className="flex-shrink-0"
        style={{ 
          color: iconColor,
          width: '16px',
          height: '16px',
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
