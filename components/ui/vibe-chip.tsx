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

// Helper to brighten color by 12-15%
function brightenColor(hex: string, percent: number = 13): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16) & 0xFF
  const g = (num >> 8) & 0xFF
  const b = num & 0xFF
  
  const newR = Math.min(255, Math.round(r + (255 - r) * percent / 100))
  const newG = Math.min(255, Math.round(g + (255 - g) * percent / 100))
  const newB = Math.min(255, Math.round(b + (255 - b) * percent / 100))
  
  return '#' + ((newR << 16) | (newG << 8) | newB).toString(16).padStart(6, '0').toUpperCase()
}

export function VibeChip({
  vibe,
  selected = false,
  onClick,
  delay = 0,
}: VibeChipProps) {
  const accentColor = VibeColors[vibe.id] || '#6EC1FF'
  const icon = VibeIcons[vibe.id] || null
  const iconColor = selected ? brightenColor(accentColor, 13) : accentColor
  
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: 1,
        scale: selected ? 1.06 : 1
      }}
      exit={{ opacity: 0 }}
      transition={{ delay, duration: 0.2 }}
      whileTap={{ 
        scale: 0.97,
        transition: { duration: 0.1 }
      }}
      onClick={onClick}
      className={cn(
        "shrink-0 px-[14px] py-[10px] rounded-[14px]",
        "font-semibold text-base tracking-tight",
        "transition-all duration-300",
        "touch-manipulation",
        "overflow-hidden flex items-center gap-2",
        "relative",
        "text-black"
      )}
      style={{
        background: '#F5F5F5',
        border: selected
          ? '1.5px solid rgba(255,255,255,0.3)'
          : '1px solid rgba(255,255,255,0.15)',
        boxShadow: selected 
          ? '0 1px 4px rgba(0,0,0,0.2)' 
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
          style={{ color: iconColor }}
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
