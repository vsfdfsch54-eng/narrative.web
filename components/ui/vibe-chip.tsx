"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Vibe } from "@/lib/types"
import { VibeIcons, VibeColors } from "./vibe-icons"
import { tokens } from "@/lib/design-tokens"

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
      transition={{ delay, duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      whileTap={{ 
        scale: 0.98,
        transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] }
      }}
      onClick={onClick}
      className={cn(
        "shrink-0",
        "font-medium text-[15px] tracking-tight",
        "transition-all duration-150 ease-in-out",
        "touch-manipulation",
        "overflow-hidden flex items-center",
        "relative",
        selected ? "text-white" : "text-black"
      )}
      style={{
        height: '44px',
        borderRadius: tokens.radii.button,
        padding: `${tokens.spacing[12]} ${tokens.spacing[16]}`,
        gap: tokens.spacing[12],
        background: selected ? tokens.colors.accentPrimary : tokens.colors.surfaceCard,
        color: selected ? '#FFFFFF' : tokens.colors.textPrimary,
        border: selected ? 'none' : `1px solid ${tokens.colors.borderSubtle}`,
        boxShadow: selected ? tokens.shadows.card : 'none',
        willChange: "transform"
      }}
    >
      {icon && (
        <div
          className="flex-shrink-0"
          style={{ 
            color: iconColor,
            width: '18px',
            height: '18px',
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
