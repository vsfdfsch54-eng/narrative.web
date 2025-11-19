"use client"

import { useRouter, usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Calendar, MessageSquare, User } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNav() {
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
      className={cn(
        "absolute bottom-0 left-0 right-0 z-50"
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "pointer-events-auto h-20",
          "bg-[#0A0A0A] border-t border-white/10",
        )}
        style={{ willChange: "transform, opacity" }}
      >
        <div className="flex items-center justify-around gap-2 h-full px-4">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <motion.button
                key={item.path}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  // Prefetch for instant navigation
                  router.prefetch(item.path)
                  router.push(item.path)
                }}
                type="button"
                className={cn(
                  "flex flex-col items-center justify-center gap-1",
                  "h-14 w-14 rounded-full",
                  "transition-all duration-200",
                  "touch-manipulation cursor-pointer relative z-10 select-none",
                  item.isActive
                    ? "bg-white text-black"
                    : "bg-white/5 text-white/80 border border-white/10 hover:bg-white/8"
                )}
                style={{ willChange: "transform" }}
                transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-all duration-300",
                    item.isActive 
                      ? "text-black" 
                      : "text-white/80"
                  )}
                />
                <span
                  className={cn(
                    "text-[9px] font-semibold transition-all duration-300 tracking-wide",
                    item.isActive 
                      ? "text-black" 
                      : "text-white/80"
                  )}
                >
                  {item.label}
                </span>
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
