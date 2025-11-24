"use client"

import { useRouter, usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Calendar, MessageSquare, User } from "lucide-react"
import { tokens } from "@/lib/design-tokens"

export function FloatingDock() {
  const router = useRouter()
  const pathname = usePathname()

  const isChatActive =
    pathname === "/vibe" ||
    pathname === "/chat" ||
    pathname === "/connect" ||
    pathname.startsWith("/chat/")
  const isProfileActive = pathname === "/profile"
  const isCalendarActive = pathname === "/calendar"

  const navItems = [
    {
      icon: Calendar,
      label: "Calendar",
      path: "/calendar",
      isActive: isCalendarActive,
    },
    {
      icon: MessageSquare,
      label: "Chat",
      path: "/vibe",
      isActive: isChatActive,
    },
    {
      icon: User,
      label: "Profile",
      path: "/profile",
      isActive: isProfileActive,
    },
  ]

  return (
    <div
      style={{
        position: 'fixed',
        bottom: `calc(env(safe-area-inset-bottom) + 20px)`,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 'min(100%, 460px)',
        padding: `0 ${tokens.layout.paddingHorizontal}`,
        zIndex: 30,
        pointerEvents: 'none',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.2,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{
          pointerEvents: 'auto',
          background: 'rgba(248, 248, 249, 0.92)',
          borderRadius: tokens.radii.pill,
          border: '1px solid rgba(12, 12, 14, 0.08)',
          boxShadow: tokens.shadows.dock,
          padding: `${tokens.spacing[10]} ${tokens.spacing[16]}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: tokens.spacing[18],
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <motion.button
              key={item.path}
              whileTap={{ scale: 0.96 }}
              transition={{
                duration: 0.14,
                ease: [0.22, 1, 0.36, 1],
              }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                router.prefetch(item.path)
                router.push(item.path)
              }}
              type="button"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: tokens.radii.circle,
                background: item.isActive ? tokens.colors.surface2 : 'transparent',
                color: item.isActive ? tokens.colors.textOnPill : tokens.colors.textPrimaryOnDark,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                outline: 'none',
                boxShadow: item.isActive ? tokens.shadows.pillUnselected : 'none',
                opacity: item.isActive ? 1 : 0.85,
                pointerEvents: 'auto',
              }}
            >
              <Icon
                style={{
                  width: '20px',
                  height: '20px',
                  color: item.isActive ? tokens.colors.textOnPill : tokens.colors.textPrimaryOnDark,
                  strokeWidth: item.isActive ? 2.4 : 2,
                }}
              />
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}

