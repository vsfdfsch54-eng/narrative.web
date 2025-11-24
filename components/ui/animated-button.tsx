"use client"

import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"
import { tokens } from "@/lib/design-tokens"

interface AnimatedButtonProps extends Omit<HTMLMotionProps<"button">, "style"> {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "ghost"
  size?: "default" | "large" | "small"
  fullWidth?: boolean
  style?: React.CSSProperties
}

export function AnimatedButton({
  children,
  variant = "primary",
  size = "default",
  fullWidth = false,
  className,
  disabled,
  ...props
}: AnimatedButtonProps) {
  const height = size === "large" ? "48px" : size === "small" ? "36px" : "44px"
  const padding = size === "small" ? "8px 14px" : size === "large" ? "12px 20px" : "10px 16px"

  const variantStyles = {
    primary: {
      background: tokens.colors.surface1,
      color: tokens.colors.textOnPill,
      boxShadow: tokens.shadows.pillUnselected,
    },
    secondary: {
      background: tokens.colors.surface2,
      color: tokens.colors.textOnPill,
      boxShadow: tokens.shadows.pillUnselected,
    },
    ghost: {
      background: 'transparent',
      color: tokens.colors.textPrimaryOnDark,
      boxShadow: 'none',
    },
  }

  const styles = variantStyles[variant]

  const { style: propsStyle, ...restProps } = props

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      whileHover={disabled ? {} : { y: -1 }}
      transition={{
        duration: 0.14,
        ease: [0.22, 1, 0.36, 1],
      }}
      disabled={disabled}
      className={cn("touch-manipulation", className)}
      style={{
        height,
        minHeight: '44px',
        padding,
        width: fullWidth ? '100%' : '100%',
        borderRadius: tokens.radii.pill,
        ...styles,
        border: 'none',
        fontSize: size === "small" ? '13px' : size === "large" ? '16px' : '15px',
        fontWeight: 500,
        letterSpacing: '0',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        outline: 'none',
        pointerEvents: disabled ? 'none' : 'auto',
        touchAction: 'manipulation',
        ...propsStyle,
      }}
      {...restProps}
    >
      {children}
    </motion.button>
  )
}

