"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, MessageSquare, User, MoreVertical } from "lucide-react"
import { colors, components, shadows, motion as motionConfig } from "@/lib/design-system"

export function TopNav() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside as EventListener)
      document.addEventListener("touchstart", handleClickOutside as EventListener)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside as EventListener)
      document.removeEventListener("touchstart", handleClickOutside as EventListener)
    }
  }, [isOpen])

  const isChatActive = pathname === "/vibe" || pathname === "/chat" || pathname === "/connect" || pathname.startsWith("/chat/")
  const isProfileActive = pathname === "/profile"
  const isCalendarActive = pathname === "/calendar"

  const menuItems = [
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

  const handleItemClick = (path: string) => {
    router.push(path)
    setIsOpen(false)
  }

  return (
    <div 
      style={{
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `0 24px`,
        borderBottom: `1px solid ${colors.border}`,
        position: 'sticky',
        top: 0,
        background: colors.background,
        zIndex: 100,
      }}
    >
      {/* Narrative Logo */}
      <h1 style={{
        fontSize: '20px',
        fontWeight: 600,
        letterSpacing: '-0.01em',
        color: colors.textPrimary,
        margin: 0,
      }}>
        Narrative
      </h1>

      {/* Three-dot Menu */}
      <div className="relative" ref={menuRef}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          transition={{ duration: motionConfig.duration.fast / 1000, ease: motionConfig.easing }}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: components.button.radius,
            background: colors.background,
            border: `1px solid ${colors.border}`,
            color: colors.textSecondary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: shadows.button,
          }}
          className="hover:opacity-80 transition-opacity"
        >
          <MoreVertical className="w-5 h-5" />
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: motionConfig.duration.fast / 1000 }}
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: motionConfig.duration.fast / 1000, ease: motionConfig.easing }}
                style={{
                  position: 'absolute',
                  top: '52px',
                  right: 0,
                  zIndex: 50,
                  minWidth: '180px',
                  background: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: components.card.radius,
                  boxShadow: shadows.card,
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '4px 0' }}>
                  {menuItems.map((item, index) => {
                    const Icon = item.icon
                    return (
                      <motion.button
                        key={item.path}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleItemClick(item.path)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          textAlign: 'left',
                          background: item.isActive ? colors.surfaceHover : 'transparent',
                          color: item.isActive ? colors.textPrimary : colors.textSecondary,
                          borderBottom: index < menuItems.length - 1 ? `1px solid ${colors.border}` : 'none',
                        }}
                        className="transition-all duration-200 hover:bg-gray-50"
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>{item.label}</span>
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

