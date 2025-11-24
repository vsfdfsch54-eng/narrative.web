"use client"

import { useRouter, usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Calendar, MessageSquare, User } from "lucide-react"
import { tokens } from "@/lib/design-tokens"

export function FloatingDock() {
  const router = useRouter()
  const pathname = usePathname()

  // Determine active state based on pathname
  const isChatActive = pathname === "/vibe" || pathname === "/chat" || pathname === "/connect" || pathname.startsWith("/chat/")
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
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        width: '100%',
        maxWidth: tokens.layout.maxWidth,
        padding: `0 ${tokens.layout.paddingHorizontal}`,
        paddingBottom: `calc(${tokens.spacing[20]} + env(safe-area-inset-bottom))`,
        pointerEvents: 'none',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.2,
          ease: [0.22, 1, 0.36, 1]
        }}
        style={{
          pointerEvents: 'auto',
          background: tokens.colors.surface1,
          borderRadius: tokens.radii.pill,
          boxShadow: tokens.shadows.dock,
          padding: tokens.spacing[12],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: tokens.spacing[20],
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: `1px solid rgba(255, 255, 255, 0.1)`, // Subtle border for visibility
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <motion.button
              key={item.path}
              whileTap={{ scale: 0.98 }}
              transition={{ 
                duration: 0.14,
                ease: [0.22, 1, 0.36, 1]
              }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                router.prefetch(item.path)
                router.push(item.path)
              }}
              type="button"
              style={{
                width: '44px',
                height: '44px',
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
                opacity: item.isActive ? 1 : 0.8,
              }}
            >
              <Icon
                style={{
                  width: '20px',
                  height: '20px',
                  color: item.isActive ? tokens.colors.textOnPill : tokens.colors.textPrimaryOnDark,
                  strokeWidth: item.isActive ? 2.5 : 2,
                }}
              />
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}

