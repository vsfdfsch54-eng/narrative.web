"use client"

import { ReactNode } from "react"
import { tokens } from "@/lib/design-tokens"

interface ChipProps {
  children: ReactNode
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "danger"
  selected?: boolean
  onClick?: () => void
}

export function Chip({ children, variant = "default", selected = false, onClick }: ChipProps) {
  const accentColors = {
    default: tokens.colors.textSecondary,
    primary: tokens.colors.accentPrimary,
    secondary: tokens.colors.accentSecondary,
    success: tokens.colors.accentSuccess,
    warning: tokens.colors.accentWarning,
    danger: tokens.colors.accentDanger,
  }

  const accentColor = accentColors[variant]

  return (
    <button
      onClick={onClick}
      style={{
        padding: `${tokens.spacing[8]} ${tokens.spacing[16]}`,
        borderRadius: tokens.radii.button,
        background: selected ? accentColor : tokens.colors.surfaceCard,
        color: selected ? '#FFFFFF' : accentColor,
        border: selected ? 'none' : `1px solid ${accentColor}40`,
        fontSize: tokens.typography.caption.fontSize,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.background = `${accentColor}10`
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.background = tokens.colors.surfaceCard
        }
      }}
    >
      {children}
    </button>
  )
}

