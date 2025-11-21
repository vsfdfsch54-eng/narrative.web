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
    primary: tokens.colors.accentBlue,
    secondary: tokens.colors.accentPurple,
    success: tokens.colors.accentGreen,
    warning: tokens.colors.accentOrange,
    danger: tokens.colors.accentPink,
  }

  const accentColor = accentColors[variant]

  return (
    <button
      onClick={onClick}
      style={{
        padding: `${tokens.spacing[8]} ${tokens.spacing[16]}`,
        borderRadius: tokens.radii.chip,
        background: selected ? accentColor : tokens.colors.surfacePrimary,
        color: selected ? '#FFFFFF' : accentColor,
        border: selected ? 'none' : `1px solid ${tokens.colors.borderStrong}`,
        fontSize: tokens.typography.caption.fontSize,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.background = tokens.colors.surfaceSecondary
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.background = tokens.colors.surfacePrimary
        }
      }}
    >
      {children}
    </button>
  )
}
