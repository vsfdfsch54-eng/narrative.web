"use client"

import { ReactNode } from "react"
import { Header } from "./ui/header"
import { FloatingDock } from "./ui/floating-dock"
import { tokens } from "@/lib/design-tokens"

interface AppShellProps {
  children: ReactNode
  title?: string
  showHeader?: boolean
  showDock?: boolean
}

export function AppShell({
  children,
  title,
  showHeader = true,
  showDock = true,
}: AppShellProps) {
  const contentPaddingTop = showHeader
    ? `calc(96px + env(safe-area-inset-top))`
    : `calc(32px + env(safe-area-inset-top))`
  const contentPaddingBottom = `calc(200px + env(safe-area-inset-bottom))`

  return (
    <div
      style={{
        minHeight: '100vh',
        background: tokens.colors.backgroundApp,
        color: tokens.colors.textPrimaryOnDark,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {showHeader && <Header title={title} />}
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: tokens.layout.maxWidth,
          margin: '0 auto',
          padding: `0 ${tokens.layout.paddingHorizontal}`,
          paddingTop: contentPaddingTop,
          paddingBottom: contentPaddingBottom,
          boxSizing: 'border-box',
        }}
      >
        {children}
      </main>
      {showDock && <FloatingDock />}
    </div>
  )
}
