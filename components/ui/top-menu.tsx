"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, MessageSquare, User, MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { colors, components, shadows, motion as motionConfig } from "@/lib/design-system"

export function TopMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Close menu when clicking outside
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

  // Determine active state based on pathname
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
    <div className="relative" ref={menuRef}>
      {/* Three dots button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        transition={{ duration: motionConfig.duration.fast / 1000, ease: motionConfig.easing }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          borderRadius: components.button.radius,
          background: colors.background,
          border: `1px solid ${colors.border}`,
          color: colors.textSecondary,
          boxShadow: shadows.button,
        }}
        className="transition-all duration-200 hover:opacity-80 touch-manipulation"
      >
        <MoreVertical className="w-5 h-5" />
      </motion.button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: motionConfig.duration.fast / 1000, ease: motionConfig.easing }}
              style={{
                position: 'absolute',
                top: '48px',
                left: 0,
                zIndex: 50,
                minWidth: '180px',
                background: colors.background,
                border: `1px solid ${colors.borderStrong}`,
                borderRadius: components.card.radius,
                boxShadow: shadows.card,
                overflow: 'hidden',
              }}
            >
              <div className="py-2">
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
                      }}
                      className="transition-all duration-200 touch-manipulation hover:bg-gray-50"
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-[14px] font-medium">{item.label}</span>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

