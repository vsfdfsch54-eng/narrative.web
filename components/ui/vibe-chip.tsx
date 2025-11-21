"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Vibe } from "@/lib/types"
import { VibeIcons, VibeColors } from "./vibe-icons"

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
  const accentColor = VibeColors[vibe.id] || '#6EC1FF'
  const icon = VibeIcons[vibe.id] || null
  
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
        "shrink-0 px-[14px] py-[10px] rounded-[12px]",
        "font-semibold text-base tracking-tight",
        "transition-all duration-300",
        "touch-manipulation",
        "overflow-hidden flex items-center gap-2",
        "relative",
        "bg-white",
        "text-black"
      )}
      style={{
        border: selected
          ? '1.5px solid rgba(0,0,0,0.25)'
          : '1px solid rgba(0,0,0,0.12)',
        boxShadow: selected 
          ? '0 2px 6px rgba(0,0,0,0.08)' 
          : 'none',
        willChange: "transform"
      }}
    >
      {icon && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
          style={{ color: accentColor }}
        >
          {icon}
        </motion.div>
      )}
      <span className="relative z-10 text-center leading-tight whitespace-nowrap">
        {vibe.label}
      </span>
    </motion.button>
  )
}
