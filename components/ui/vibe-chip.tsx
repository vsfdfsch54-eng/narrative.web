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
          ? "bg-[rgba(255,255,255,0.15)] text-white border border-[rgba(110,193,255,0.4)]"
          : "bg-[rgba(255,255,255,0.04)] text-white border border-[rgba(255,255,255,0.08)]"
      )}
      style={{
        backdropFilter: 'blur(12px)',
        boxShadow: selected 
          ? '0px 0px 12px rgba(110,193,255,0.45)' 
          : 'none',
        willChange: "transform"
      }}
    >
      <span className={cn(
        "relative z-10 text-center leading-tight whitespace-nowrap",
        selected 
          ? "text-white font-semibold"
          : "text-white"
      )}>
        {vibe.label}
      </span>
    </motion.button>
  )
}
