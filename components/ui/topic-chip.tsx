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
        "shrink-0 px-4 py-2.5 rounded-[14px]",
        "font-medium text-base tracking-tight",
        "transition-all duration-300",
        "touch-manipulation",
        "overflow-hidden flex items-center justify-center",
        "relative",
        "min-h-[42px]",
        selected
          ? "bg-[rgba(255,255,255,0.18)] text-white border border-[rgba(110,193,255,0.5)]"
          : "bg-[rgba(255,255,255,0.06)] text-white border border-[rgba(255,255,255,0.12)]"
      )}
      style={{
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: selected 
          ? '0px 0px 16px rgba(110,193,255,0.5), inset 0 1px 0 rgba(255,255,255,0.1)' 
          : '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
        willChange: "transform"
      }}
    >
      {/* Glass highlight overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-[14px]" />
      
      <span className={cn(
        "relative z-10 text-center leading-tight whitespace-nowrap",
        selected 
          ? "text-white font-semibold drop-shadow-sm"
          : "text-white"
      )}>
        {topic.label}
      </span>
    </motion.button>
  )
}
