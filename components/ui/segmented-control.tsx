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
        gap: tokens.spacing[14],
        padding: tokens.spacing[8],
        background: 'transparent',
        borderRadius: tokens.radii.pill,
        border: 'none',
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
              padding: `12px ${tokens.spacing[16]}`,
              borderRadius: tokens.radii.pill,
              background: tokens.colors.pillPrimary,
              color: tokens.colors.textOnPill,
              border: 'none',
              boxShadow: tokens.shadows.pill,
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
