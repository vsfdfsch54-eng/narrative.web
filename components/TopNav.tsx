"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, MessageSquare, User, MoreVertical } from "lucide-react"
import { tokens } from "@/lib/design-tokens"

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
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '520px',
        margin: '0 auto',
        padding: `0 ${tokens.spacing[20]}`,
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
          color: tokens.colors.textPrimary,
          margin: 0,
        }}
      >
        Narrative
      </h1>

      <div className="relative" ref={menuRef}>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: tokens.radii.pill,
            background: tokens.colors.surfacePrimary,
            border: `1px solid ${tokens.colors.borderSubtle}`,
            color: tokens.colors.textDark,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
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
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  top: '52px',
                  right: 0,
                  zIndex: 50,
                  minWidth: '180px',
                  background: tokens.colors.surfacePrimary,
                  borderRadius: tokens.radii.popover,
                  boxShadow: tokens.shadows.elevated,
                  border: `1px solid ${tokens.colors.borderSubtle}`,
                  overflow: 'hidden',
                  padding: `${tokens.spacing[8]} 0`,
                }}
              >
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
                        gap: tokens.spacing[12],
                        padding: `${tokens.spacing[12]} ${tokens.spacing[16]}`,
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        color: tokens.colors.textDark,
                        cursor: 'pointer',
                        ...tokens.typography.body,
                        fontWeight: item.isActive ? 500 : 400,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = tokens.colors.surfaceSecondary
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </motion.button>
                  )
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
