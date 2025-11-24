"use client"

import { tokens } from "@/lib/design-tokens"

interface HeaderProps {
  title?: string
  children?: React.ReactNode
}

export function Header({ title = "Narrative", children }: HeaderProps) {
  return (
    <div
      style={{
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: tokens.layout.maxWidth,
        margin: '0 auto',
        padding: `0 ${tokens.layout.paddingHorizontal}`,
        background: 'transparent',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {children || (
        <h1
          style={{
            ...tokens.typography.title,
            color: tokens.colors.textPrimaryOnDark,
            margin: 0,
            textAlign: 'center',
          }}
        >
          {title}
        </h1>
      )}
    </div>
  )
}

