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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.2 }}
      whileTap={{ 
        scale: 0.98,
        transition: { duration: 0.1 }
      }}
      onClick={onClick}
      className={cn(
        "shrink-0 px-4 py-2.5 rounded-[12px]",
        "font-medium text-base tracking-tight",
        "transition-all duration-300",
        "touch-manipulation",
        "overflow-hidden flex items-center justify-center",
        "relative",
        selected
          ? "bg-white text-[#0A0A0A] border border-white"
          : "bg-[rgba(255,255,255,0.04)] text-[#f1f1f3] border border-[rgba(255,255,255,0.08)]"
      )}
      style={{
        backdropFilter: 'blur(12px)',
        boxShadow: selected 
          ? '0 0 0 1px rgba(110,193,255,0.4), 0 8px 20px rgba(0,0,0,0.25)' 
          : '0 8px 20px rgba(0,0,0,0.25)',
        willChange: "transform"
      }}
    >
      {selected && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-[#6EC1FF]/20 to-[#00E1B0]/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
      <span className={cn(
        "relative z-10 text-center leading-tight whitespace-nowrap",
        selected 
          ? "text-[#0A0A0A] font-semibold"
          : "text-[#f1f1f3]"
      )}>
        {topic.label}
      </span>
    </motion.button>
  )
}
