"use client"

import { ReactNode } from "react"
import { TopNav } from "./TopNav"
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
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <TopNav />
      <div
        style={{
          maxWidth: '480px',
          margin: '0 auto',
          padding: tokens.spacing[20],
        }}
      >
        {children}
      </div>
    </div>
  )
}
