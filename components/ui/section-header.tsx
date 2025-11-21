"use client"

import { ReactNode } from "react"
import { tokens } from "@/lib/design-tokens"

interface SectionHeaderProps {
  title: string
  subtitle?: string
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div style={{ marginBottom: tokens.spacing[20] }}>
      <h2
        style={{
          ...tokens.typography.headingM,
          color: tokens.colors.textPrimary,
          margin: 0,
          marginBottom: subtitle ? tokens.spacing[8] : 0,
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          style={{
            ...tokens.typography.body,
            color: tokens.colors.textSecondary,
            margin: 0,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
