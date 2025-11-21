"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Vibe } from "@/lib/types"
import { VibeIcons, VibeColors } from "./vibe-icons"
import { components, motion as motionConfig } from "@/lib/design-system"

interface VibeChipProps {
  vibe: Vibe
  selected?: boolean
  onClick?: () => void
  delay?: number
}

// Helper to brighten color by 12%
function brightenColor(hex: string, percent: number = 12): string {
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
  const iconColor = selected ? brightenColor(accentColor, 12) : accentColor
  
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay, duration: motionConfig.duration.normal / 1000, ease: motionConfig.easing }}
      whileTap={{ 
        scale: 0.98,
        transition: { duration: motionConfig.duration.fast / 1000, ease: motionConfig.easing }
      }}
      onClick={onClick}
      className={cn(
        "shrink-0",
        "font-medium text-[15px] tracking-tight",
        "transition-all duration-150 ease-in-out",
        "touch-manipulation",
        "overflow-hidden flex items-center",
        "relative",
        "text-black"
      )}
      style={{
        height: components.chip.height,
        borderRadius: components.chip.radius,
        padding: components.chip.padding,
        gap: components.chip.gap,
        background: selected ? components.chip.selected.background : components.chip.background,
        border: selected ? components.chip.selected.border : components.chip.unselected.border,
        boxShadow: selected ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
        willChange: "transform"
      }}
    >
      {icon && (
        <div
          className="flex-shrink-0"
          style={{ 
            color: iconColor,
            width: components.chip.iconSize,
            height: components.chip.iconSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {icon}
        </div>
      )}
      <span className="relative z-10 text-center leading-tight whitespace-nowrap">
        {vibe.label}
      </span>
    </motion.button>
  )
}
