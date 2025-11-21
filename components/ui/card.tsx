"use client"

import { cn } from "@/lib/utils"
import { components } from "@/lib/design-system"

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
  variant?: "default" | "outlined"
}

export function Card({ children, className, padding = true, variant = "default" }: CardProps) {
  return (
    <div
      className={cn(
        className
      )}
      style={{
        borderRadius: components.card.radius,
        background: components.card.background,
        border: variant === "outlined" ? `1px solid ${components.card.border}` : 'none',
        boxShadow: variant === "outlined" ? components.card.shadow : 'none',
        padding: padding ? components.card.padding : 0,
      }}
    >
      {children}
    </div>
  )
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}
