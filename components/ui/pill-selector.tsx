"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { tokens } from "@/lib/design-tokens"

interface PillSelectorOption {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
}

interface PillSelectorProps {
  options: PillSelectorOption[]
  selectedId?: string
  onSelect: (id: string) => void
  size?: "default" | "small" | "large"
  className?: string
}

export function PillSelector({
  options,
  selectedId,
  onSelect,
  size = "default",
  className,
}: PillSelectorProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: tokens.spacing[12],
        flexWrap: 'wrap',
        ...(className ? {} : {}),
      }}
      className={className}
    >
      {options.map((option) => {
        const isSelected = selectedId === option.id
        const Icon = option.icon

        return (
          <motion.button
            key={option.id}
            whileTap={{ scale: 0.98 }}
            whileHover={{ y: -1 }}
            transition={{ 
              duration: 0.14,
              ease: [0.22, 1, 0.36, 1]
            }}
            onClick={() => onSelect(option.id)}
            style={{
              height: size === "small" ? "36px" : size === "large" ? "48px" : "44px",
              padding: size === "small" ? "8px 12px" : size === "large" ? "14px 20px" : "12px 16px",
              borderRadius: tokens.radii.pill,
              background: isSelected ? tokens.colors.surface2 : tokens.colors.surface1,
              color: tokens.colors.textOnPill,
              border: 'none',
              boxShadow: isSelected ? tokens.shadows.pillSelected : tokens.shadows.pillUnselected,
              fontSize: size === "small" ? '13px' : size === "large" ? '16px' : '15px',
              fontWeight: 400,
              letterSpacing: '0',
              cursor: 'pointer',
              outline: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: Icon ? tokens.spacing[8] : 0,
            }}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {option.label}
          </motion.button>
        )
      })}
    </div>
  )
}

