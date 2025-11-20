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
        scale: 0.98,
        transition: { duration: 0.1 }
      }}
      onClick={onClick}
      className={cn(
        "relative min-w-[130px] sm:min-w-[150px] min-h-[48px] px-6 py-3.5 rounded-full",
        "font-semibold text-sm tracking-tight",
        "transition-all duration-200",
        "group focus-ring touch-manipulation",
        "overflow-hidden flex items-center justify-center",
        "flex-shrink-0",
        selected
          ? "bg-[#f1f1f3] text-[#0a0a0c]"
          : "bg-white/5 text-[#f1f1f3]/90 border border-white/10 hover:bg-white/10"
      )}
      style={{ willChange: "transform" }}
    >
      <span className={cn(
        "relative z-10 text-center px-1 leading-tight line-clamp-2",
        selected 
          ? "text-[#0a0a0c] font-semibold"
          : "text-[#f1f1f3]/90"
      )}>
        {topic.label}
      </span>
    </motion.button>
  )
}
