"use client"

import { useRouter, usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Calendar, MessageSquare, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { colors, radii, motion as motionConfig } from "@/lib/design-system"

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
        "fixed bottom-0 left-0 right-0 z-[100]",
        "pointer-events-none",
        "w-full",
        "sm:max-w-[375px] sm:left-1/2 sm:-translate-x-1/2"
      )}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: motionConfig.duration.normal / 1000, ease: motionConfig.easing }}
        className={cn(
          "pointer-events-auto",
          "bg-[#0F0F0F] border-t",
        )}
        style={{
          borderColor: colors.border,
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingTop: '12px',
        }}
      >
        <div className="flex items-center justify-around gap-2 h-full px-4">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <motion.button
                key={item.path}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: motionConfig.duration.fast / 1000, ease: motionConfig.easing }}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  router.prefetch(item.path)
                  router.push(item.path)
                }}
                type="button"
                className={cn(
                  "flex flex-col items-center justify-center gap-1",
                  "transition-all duration-150 ease-in-out",
                  "touch-manipulation cursor-pointer relative z-10 select-none",
                )}
                style={{
                  height: '56px',
                  width: '56px',
                  borderRadius: item.isActive ? radii.button : '50%',
                  background: item.isActive ? colors.chipBg : 'transparent',
                  color: item.isActive ? colors.chipText : colors.textSecondary,
                }}
              >
                <Icon
                  className="h-4 w-4"
                  style={{
                    color: item.isActive ? colors.chipText : colors.textSecondary,
                  }}
                />
                <span
                  className="text-[11px] font-medium"
                  style={{
                    color: item.isActive ? colors.chipText : colors.textSecondary,
                  }}
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
