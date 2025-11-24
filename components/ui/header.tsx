"use client"

import { tokens } from "@/lib/design-tokens"

interface HeaderProps {
  title?: string
  children?: React.ReactNode
}

export function Header({ title = "Narrative", children }: HeaderProps) {
  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        pointerEvents: 'none',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div
        style={{
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: tokens.layout.maxWidth,
          margin: '0 auto',
          padding: `0 ${tokens.layout.paddingHorizontal}`,
          pointerEvents: 'auto',
          background: 'transparent',
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
    </header>
  )
}

