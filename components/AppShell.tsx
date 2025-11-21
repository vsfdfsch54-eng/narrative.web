"use client"

import { ReactNode } from "react"
import { TopNav } from "./TopNav"
import { BottomDockNav } from "./BottomDockNav"
import { tokens } from "@/lib/design-tokens"

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: tokens.colors.backgroundApp,
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: '120px',
      }}
    >
      <TopNav />
      <div
        style={{
          maxWidth: tokens.layout.maxWidth,
          margin: '0 auto',
          padding: `0 ${tokens.layout.paddingHorizontal}`,
        }}
      >
        {children}
      </div>
      <BottomDockNav />
    </div>
  )
}
