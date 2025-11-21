"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Topic } from "@/lib/types"
import { TopicIcons, TopicColors, brightenColor, DefaultTopicIcon } from "./topic-icons"
import { useDeviceScale } from "@/hooks/use-device-scale"

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
  const deviceScale = useDeviceScale()
  
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: 1,
        scale: selected ? deviceScale : 1
      }}
      exit={{ opacity: 0 }}
      transition={{ delay, duration: 0.2 }}
      whileTap={{ 
        scale: 0.97,
        transition: { duration: 0.1 }
      }}
      onClick={onClick}
      className={cn(
        "shrink-0 px-[14px] py-[8px] rounded-[16px]",
        "font-semibold text-base tracking-tight",
        "transition-all duration-300",
        "touch-manipulation",
        "overflow-hidden flex items-center gap-2",
        "relative",
        "text-black"
      )}
      style={{
        height: '44px',
        background: selected ? '#F2F2F2' : '#FFFFFF',
        border: selected
          ? '2px solid #000000'
          : '1px solid rgba(0,0,0,0.2)',
        boxShadow: selected 
          ? '0 2px 8px rgba(0,0,0,0.25)' 
          : 'none',
        willChange: "transform"
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
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
      </motion.div>
      <span className="relative z-10 text-center leading-tight whitespace-nowrap">
        {topic.label}
      </span>
    </motion.button>
  )
}
