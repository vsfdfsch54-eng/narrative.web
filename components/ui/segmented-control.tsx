"use client"

import { ReactNode } from "react"
import { motion } from "framer-motion"
import { tokens } from "@/lib/design-tokens"

interface SegmentedControlProps {
  options: { value: string; label: string }[]
  value: string | null
  onChange: (value: string) => void
}

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: tokens.spacing[8],
        padding: tokens.spacing[8],
        background: tokens.colors.surfacePrimary,
        borderRadius: tokens.radii.pill,
        border: `1px solid ${tokens.colors.borderSubtle}`,
        boxShadow: tokens.shadows.card,
      }}
    >
      {options.map((option) => {
        const isSelected = value === option.value
        return (
          <motion.button
            key={option.value}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(option.value)}
            style={{
              flex: 1,
              padding: `${tokens.spacing[12]} ${tokens.spacing[16]}`,
              borderRadius: tokens.radii.pill,
              background: isSelected ? tokens.colors.backgroundApp : 'transparent',
              color: isSelected ? tokens.colors.textPrimaryOnDark : tokens.colors.textPrimary,
              border: 'none',
              ...tokens.typography.label,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {option.label}
          </motion.button>
        )
      })}
    </div>
  )
}
