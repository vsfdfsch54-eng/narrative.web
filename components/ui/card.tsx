"use client"

import { ReactNode } from "react"
import { tokens } from "@/lib/design-tokens"
import { cn } from "@/lib/utils"

interface CardProps {
  children: ReactNode
  className?: string
  padding?: boolean
  variant?: "default" | "outlined"
  style?: React.CSSProperties
}

export function Card({ children, className, padding = true, variant = "default", style }: CardProps) {
  return (
    <div
      className={cn(className)}
      style={{
        background: tokens.colors.surfacePrimary,
        borderRadius: tokens.radii.card,
        boxShadow: tokens.shadows.card,
        border: variant === "outlined" ? `1px solid ${tokens.colors.borderSubtle}` : 'none',
        padding: padding ? tokens.spacing[20] : 0,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}
