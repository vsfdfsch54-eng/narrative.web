"use client"

import { useRouter, usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"

export function ProfileButton() {
  const router = useRouter()
  const pathname = usePathname()
  
  // Don't show on login page or profile page itself
  if (pathname === "/login" || pathname === "/profile") {
    return null
  }

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => router.push("/profile")}
      className={cn(
        "fixed bottom-6 left-6 z-50",
        "h-14 w-14 rounded-full",
        "bg-white text-slate-900",
        "border-2 border-white/70 backdrop-blur-xl",
        "shadow-[0_15px_35px_rgba(0,0,0,0.5)]",
        "flex items-center justify-center",
        "transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)]",
        "touch-manipulation cursor-pointer"
      )}
    >
      <User className="h-6 w-6 text-slate-900" />
    </motion.button>
  )
}

