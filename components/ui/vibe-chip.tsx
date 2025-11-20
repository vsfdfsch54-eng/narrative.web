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
        "shrink-0 px-5 py-3 rounded-[16px]",
        "font-bold text-sm tracking-tight",
        "transition-all duration-200",
        "touch-manipulation",
        "overflow-hidden flex items-center justify-center",
        "border",
        selected
          ? "bg-[#f1f1f3] text-[#0a0a0c] border-[#f1f1f3] shadow-lg"
          : "bg-[#1A1A1A] text-[#f1f1f3] border-[#1A1A1A]"
      )}
      style={{ willChange: "transform" }}
    >
      <span className={cn(
        "relative z-10 text-center leading-tight whitespace-nowrap",
        selected 
          ? "text-[#0a0a0c] font-bold"
          : "text-[#f1f1f3]"
      )}>
        {vibe.label}
      </span>
    </motion.button>
  )
}
