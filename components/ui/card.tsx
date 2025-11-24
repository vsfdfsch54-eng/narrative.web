"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { tokens } from "@/lib/design-tokens"

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  variant?: "default" | "surface1" | "surface2"
}

export function Card({ children, className, onClick, variant = "default" }: CardProps) {
  const background = variant === "surface1" 
    ? tokens.colors.surface1 
    : variant === "surface2"
    ? tokens.colors.surface2
    : `linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)`

  const Component = onClick ? motion.div : 'div'
  const motionProps = onClick ? {
    whileTap: { scale: 0.98 },
    whileHover: { y: -1 },
    transition: { duration: 0.14, ease: [0.22, 1, 0.36, 1] },
    onClick,
    style: { cursor: 'pointer' },
  } : {}

  return (
    <Component
      className={cn(className)}
      style={{
        borderRadius: '20px',
        background: variant === "default" ? undefined : background,
        backgroundImage: variant === "default" ? background : undefined,
        border: 'none',
        boxShadow: tokens.shadows.pillUnselected,
        padding: tokens.spacing[20],
        position: 'relative',
        overflow: 'hidden',
        ...motionProps.style,
      }}
      {...motionProps}
    >
      {variant === "default" && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
            opacity: 0.5,
          }}
        />
      )}
      {children}
    </Component>
  )
}

// Shadcn-compatible exports for backward compatibility
export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col space-y-1.5", className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>{children}</h3>
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("pt-0", className)}>{children}</div>
}
