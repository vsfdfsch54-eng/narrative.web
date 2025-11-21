"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, MessageSquare, User, MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"

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
        className={cn(
          "flex items-center justify-center",
          "w-10 h-10 rounded-full",
          "bg-[rgba(255,255,255,0.05)]",
          "border border-[rgba(255,255,255,0.1)]",
          "text-[#F5F5F5]",
          "transition-all duration-200",
          "hover:bg-[rgba(255,255,255,0.08)]",
          "touch-manipulation"
        )}
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
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className={cn(
                "absolute top-12 left-0 z-50",
                "min-w-[180px]",
                "bg-[#1A1A1A]",
                "border border-[rgba(255,255,255,0.1)]",
                "rounded-[16px]",
                "backdrop-blur-xl",
                "shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
                "overflow-hidden"
              )}
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
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3",
                        "text-left",
                        "transition-all duration-200",
                        "touch-manipulation",
                        item.isActive
                          ? "bg-[rgba(255,255,255,0.1)] text-[#F5F5F5]"
                          : "text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#F5F5F5]"
                      )}
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

