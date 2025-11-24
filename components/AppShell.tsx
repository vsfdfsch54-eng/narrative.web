"use client"

import { ReactNode } from "react"
import { Header } from "./ui/header"
import { FloatingDock } from "./ui/floating-dock"
import { tokens } from "@/lib/design-tokens"

interface AppShellProps {
  children: ReactNode
  title?: string
  showHeader?: boolean
}

export function AppShell({ children, title, showHeader = true }: AppShellProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: tokens.colors.backgroundApp,
        paddingTop: showHeader ? '0' : 'env(safe-area-inset-top)',
        paddingBottom: '140px', // Space for floating dock
        overflowY: 'auto',
      }}
    >
      {showHeader && <Header title={title} />}
      <div
        style={{
          maxWidth: tokens.layout.maxWidth,
          margin: '0 auto',
          padding: `0 ${tokens.layout.paddingHorizontal}`,
          overflowY: 'visible',
        }}
      >
        {children}
      </div>
      <FloatingDock />
    </div>
  )
}
