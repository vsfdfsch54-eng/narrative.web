"use client"

import { cn } from "@/lib/utils"
import { components } from "@/lib/design-system"
import React from "react"

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
  variant?: "default" | "outlined"
  style?: React.CSSProperties
}

export function Card({ children, className, padding = true, variant = "default", style }: CardProps) {
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
        ...style,
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
