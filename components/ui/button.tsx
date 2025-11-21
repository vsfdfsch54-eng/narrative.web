"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { components, motion as motionConfig } from "@/lib/design-system"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline"
  size?: "default" | "large" | "lg"
  children: React.ReactNode
}

export function Button({
  variant = "primary",
  size = "default",
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const height = (size === "large" || size === "lg") ? components.button.heightLarge : components.button.height
  const config = variant === "outline" ? components.button.secondary : components.button[variant]

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ duration: motionConfig.duration.fast / 1000, ease: motionConfig.easing }}
      disabled={disabled}
      className={cn(
        "rounded-[12px] font-semibold text-[16px]",
        "transition-all duration-150 ease-in-out",
        "touch-manipulation",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      style={{
        height,
        padding: '0 16px',
        background: config.background,
        color: config.text,
        border: 'border' in config ? config.border : 'none',
        boxShadow: 'shadow' in config && variant === "primary" ? config.shadow : 'none',
      }}
      {...props}
    >
      {children}
    </motion.button>
  )
}
