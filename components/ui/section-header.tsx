"use client"

import { ReactNode } from "react"
import { tokens } from "@/lib/design-tokens"

interface SectionHeaderProps {
  title: string
  subtitle?: string
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div style={{ marginBottom: tokens.layout.elementSpacing }}>
      <h2
        style={{
          ...tokens.typography.heading,
          color: tokens.colors.textOnPill,
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
