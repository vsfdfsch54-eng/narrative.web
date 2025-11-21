"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { components, motion as motionConfig } from "@/lib/design-system"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline"
  size?: "default" | "large" | "lg"
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
  const height = (size === "large" || size === "lg") ? components.button.heightLarge : components.button.height
  const config = variant === "outline" ? components.button.secondary : components.button[variant]

  const buttonStyles = {
    height,
    padding: '0 16px',
    background: config.background,
    color: config.text,
    border: 'border' in config ? config.border : 'none',
    boxShadow: 'shadow' in config && variant === "primary" ? config.shadow : 'none',
  }

  const buttonClasses = cn(
    "rounded-[12px] font-semibold text-[16px]",
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
      transition={{ duration: motionConfig.duration.fast / 1000, ease: motionConfig.easing }}
      disabled={disabled}
      className={buttonClasses}
      style={buttonStyles}
      {...props}
    >
      {children}
    </motion.button>
  )
}
