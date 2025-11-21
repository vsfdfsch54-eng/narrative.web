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
        "shrink-0 px-4 py-2.5 rounded-[14px]",
        "font-semibold text-base tracking-tight",
        "transition-all duration-300",
        "touch-manipulation",
        "overflow-hidden flex items-center gap-2",
        "relative",
        "min-h-[42px]",
        selected
          ? "text-[#0A0A0A]"
          : "text-[#0A0A0A]"
      )}
      style={{
        background: selected 
          ? `rgba(${hexToRgb(accentColor)}, 0.1)`
          : 'rgba(255,255,255,0.7)',
        border: selected
          ? `1px solid ${accentColor}`
          : '1px solid rgba(0,0,0,0.08)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: selected 
          ? `0 0 8px ${accentColor}33, 0 2px 8px rgba(0,0,0,0.08)` 
          : '0 2px 8px rgba(0,0,0,0.08)',
        willChange: "transform"
      }}
    >
      {icon && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: selected ? 1 : 0.8, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
          style={{ color: selected ? accentColor : 'rgba(0,0,0,0.8)' }}
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

// Helper to convert hex to RGB
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result 
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '110, 193, 255'
}
