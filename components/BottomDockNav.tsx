"use client"

import { useRouter, usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Home, Sparkles, Calendar, MessageSquare, User } from "lucide-react"
import { tokens } from "@/lib/design-tokens"

const navItems = [
  {
    icon: Home,
    label: "Home",
    path: "/",
  },
  {
    icon: Sparkles,
    label: "Vibes",
    path: "/vibe",
  },
  {
    icon: Calendar,
    label: "Calendar",
    path: "/calendar",
  },
  {
    icon: MessageSquare,
    label: "Chat",
    path: "/chat",
  },
  {
    icon: User,
    label: "Profile",
    path: "/profile",
  },
]

const hiddenPaths = ['/login', '/onboarding', '/signup', '/verify', '/welcome', '/signed-up']

export function BottomDockNav() {
  const router = useRouter()
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(path)
  }

  if (hiddenPaths.some(path => pathname.startsWith(path))) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: `calc(env(safe-area-inset-bottom) + 16px)`,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        style={{
          background: tokens.colors.pillPrimary,
          borderRadius: '28px',
          padding: '10px 20px',
          boxShadow: tokens.shadows.dock,
          display: 'flex',
          alignItems: 'center',
          gap: '22px',
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          
          return (
            <motion.button
              key={item.path}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(item.path)}
              style={{
                width: '46px',
                height: '46px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: active ? tokens.colors.pillSecondary : 'transparent',
                borderRadius: '50%',
                padding: active ? tokens.spacing[8] : 0,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Icon 
                className="w-5 h-5" 
                style={{ 
                  color: active ? tokens.colors.textOnPill : tokens.colors.textMuted,
                }} 
              />
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}
