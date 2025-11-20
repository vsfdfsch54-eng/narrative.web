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
        "relative min-w-[120px] sm:min-w-[140px] min-h-[44px] px-5 py-3 sm:px-6 sm:py-3.5 rounded-full",
        "font-medium text-sm tracking-tight",
        "transition-all duration-250",
        "group focus-ring touch-manipulation",
        "overflow-hidden flex items-center justify-center",
        "flex-shrink-0",
        selected
          ? "sleek-chip selected"
          : "sleek-chip"
      )}
      style={{ willChange: "transform" }}
    >
      <span className={cn(
        "relative z-10 text-center px-1 leading-tight line-clamp-2",
        selected 
          ? "text-black font-semibold"
          : "text-white/90"
      )}>
        {vibe.label}
      </span>
    </motion.button>
  )
}
