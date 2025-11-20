"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Topic } from "@/lib/types"

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
  return (
    <motion.button
      whileTap={{ 
        scale: 0.97,
        transition: { duration: 0.1 }
      }}
      onClick={onClick}
      className={cn(
        "shrink-0 px-4 py-2 rounded-lg",
        "font-medium text-xs tracking-tight",
        "transition-all duration-200",
        "touch-manipulation",
        "overflow-hidden flex items-center justify-center",
        selected
          ? "bg-[#f1f1f3] text-[#0a0a0c] border border-[#f1f1f3]/20"
          : "bg-white/5 text-[#f1f1f3]/70 border border-white/8 hover:bg-white/8 hover:border-white/12 hover:text-[#f1f1f3]"
      )}
      style={{ willChange: "transform" }}
    >
      <span className={cn(
        "relative z-10 text-center leading-tight whitespace-nowrap",
        selected 
          ? "text-[#0a0a0c] font-medium"
          : "text-[#f1f1f3]/70"
      )}>
        {topic.label}
      </span>
    </motion.button>
  )
}
