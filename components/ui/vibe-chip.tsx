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
  const accentColor = VibeColors[vibe.id] || tokens.colors.accentBlue
  const icon = VibeIcons[vibe.id] || null
  const iconColor = selected ? brightenColor(accentColor, 12) : accentColor
  
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: 1,
        scale: selected ? 1.06 : 1,
        backgroundColor: selected ? tokens.colors.pillSelected : tokens.colors.pillUnselected,
      }}
      exit={{ opacity: 0 }}
      transition={{ 
        delay,
        transform: { duration: 0.14, ease: 'easeOut' },
        backgroundColor: { duration: 0.18, ease: 'easeOut' },
      }}
      whileTap={{ 
        scale: selected ? 1.06 : 0.98,
        transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] }
      }}
      onClick={onClick}
      className={cn(
        "shrink-0",
        "touch-manipulation",
        "inline-flex items-center",
        "relative"
      )}
      style={{
        borderRadius: tokens.radii.pill,
        padding: '8px 14px',
        gap: '10px',
        border: 'none',
        boxShadow: selected ? tokens.shadows.pillSelected : tokens.shadows.pillUnselected,
        fontSize: '15px',
        fontWeight: 400,
        letterSpacing: '0',
        color: tokens.colors.textOnPill,
        willChange: "transform, background-color"
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
