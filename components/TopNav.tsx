"use client"

import { tokens } from "@/lib/design-tokens"

export function TopNav() {
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
        zIndex: 100,
      }}
    >
      <h1
        style={{
          fontSize: '20px',
          fontWeight: 600,
          color: tokens.colors.textPrimaryOnDark,
          margin: 0,
        }}
      >
        Narrative
      </h1>
    </div>
  )
}
