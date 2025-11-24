"use client"

import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"
import { tokens } from "@/lib/design-tokens"

interface PillProps extends Omit<HTMLMotionProps<"button">, "style"> {
  children: React.ReactNode
  selected?: boolean
  variant?: "default" | "surface1" | "surface2"
  size?: "default" | "small" | "large"
  onClick?: () => void
  style?: React.CSSProperties
}

export function Pill({
  children,
  selected = false,
  variant = "default",
  size = "default",
  className,
  onClick,
  ...props
}: PillProps) {
  const height = size === "small" ? "36px" : size === "large" ? "48px" : "44px"
  const padding = size === "small" ? "8px 12px" : size === "large" ? "14px 20px" : "12px 16px"
  
  const background = selected 
    ? tokens.colors.surface2 
    : variant === "surface1" 
    ? tokens.colors.surface1 
    : variant === "surface2"
    ? tokens.colors.surface2
    : tokens.colors.surface1

  const shadow = selected 
    ? tokens.shadows.pillSelected 
    : tokens.shadows.pillUnselected

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1 }}
      transition={{ 
        duration: 0.14,
        ease: [0.22, 1, 0.36, 1]
      }}
      onClick={onClick}
      className={cn("touch-manipulation", className)}
      style={{
        minHeight: '44px',
        height,
        padding: `12px 16px`,
        borderRadius: tokens.radii.pill,
        background,
        color: tokens.colors.textOnPill,
        border: 'none',
        boxShadow: shadow,
        fontSize: size === "small" ? '13px' : size === "large" ? '16px' : '15px',
        fontWeight: 500,
        letterSpacing: '0',
        cursor: 'pointer',
        outline: 'none',
        pointerEvents: props.disabled ? 'none' : 'auto',
        touchAction: 'manipulation',
        ...props.style,
      }}
      {...(props as any)}
    >
      {children}
    </motion.button>
  )
}

