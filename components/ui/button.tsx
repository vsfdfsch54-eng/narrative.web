"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { tokens } from "@/lib/design-tokens"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline"
  size?: "default" | "large" | "lg" | "icon" | "sm"
  children: React.ReactNode
  asChild?: boolean
}

export function Button({
  variant = "primary",
  size = "default",
  className,
  children,
  disabled,
  asChild = false,
  ...props
}: ButtonProps) {
  const height = (size === "large" || size === "lg") 
    ? '44px'
    : size === "icon" 
    ? '40px'
    : size === "sm"
    ? '36px'
    : '40px'

  const variantStyles = {
    primary: {
      background: tokens.colors.pillPrimary,
      color: tokens.colors.textOnPill,
      border: 'none',
    },
    secondary: {
      background: tokens.colors.pillPrimary,
      color: tokens.colors.textOnPill,
      border: 'none',
    },
    outline: {
      background: 'transparent',
      color: tokens.colors.textPrimaryOnDark,
      border: 'none',
    },
    ghost: {
      background: 'transparent',
      color: tokens.colors.textPrimaryOnDark,
      border: 'none',
    },
  }

  const buttonStyles = {
    height,
    padding: size === "icon" ? '0' : `10px ${tokens.spacing[14]}`,
    borderRadius: tokens.radii.button,
    ...variantStyles[variant],
    fontSize: '13px',
    fontWeight: 500,
    letterSpacing: '-0.01em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.15s ease',
    boxShadow: tokens.shadows.pill,
  }

  const buttonClasses = cn(
    "transition-all duration-150 ease-in-out",
    "touch-manipulation",
    disabled && "opacity-50 cursor-not-allowed",
    className
  )

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      className: cn(buttonClasses, (children as React.ReactElement<any>).props?.className),
      style: { ...buttonStyles, ...(children as React.ReactElement<any>).props?.style },
      disabled,
      ...props,
    })
  }

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      disabled={disabled}
      className={buttonClasses}
      style={buttonStyles}
      {...(props as any)}
    >
      {children}
    </motion.button>
  )
}
