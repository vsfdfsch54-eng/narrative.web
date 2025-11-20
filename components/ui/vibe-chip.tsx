"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Vibe } from "@/lib/types"

interface VibeChipProps {
  vibe: Vibe
  selected?: boolean
  onClick?: () => void
  delay?: number
}

export function VibeChip({
  vibe,
  selected = false,
  onClick,
  delay = 0,
}: VibeChipProps) {
  return (
    <motion.button
      whileTap={{ 
        scale: 0.98,
        transition: { duration: 0.1 }
      }}
      onClick={onClick}
      className={cn(
        "relative min-w-[120px] px-4 py-2.5 rounded-[14px]",
        "font-bold text-sm tracking-tight",
        "transition-all duration-200",
        "touch-manipulation",
        "overflow-hidden flex items-center justify-center",
        "flex-shrink-0",
        "border",
        selected
          ? "bg-[#f1f1f3] text-[#0a0a0c] border-[#f1f1f3]"
          : "bg-white/5 text-[#f1f1f3]/80 border-white/10 hover:bg-white/10 hover:border-white/20"
      )}
      style={{ willChange: "transform" }}
    >
      <span className={cn(
        "relative z-10 text-center px-1 leading-tight",
        selected 
          ? "text-[#0a0a0c] font-bold"
          : "text-[#f1f1f3]/80"
      )}>
        {vibe.label}
      </span>
    </motion.button>
  )
}
