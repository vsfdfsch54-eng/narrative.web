"use client"

import { ReactNode, useEffect, useState } from "react"
import { motion } from "framer-motion"

interface PageTransitionProps {
  children: ReactNode
}

// Optimized page transition - instant for better UX
export function ClientPageTransition({ children }: PageTransitionProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      className={isMobile ? "fixed inset-0 m-0 p-0" : "w-screen h-screen fixed inset-0 m-0 p-0"}
      style={{ 
        willChange: "opacity",
        width: '100vw',
        height: isMobile ? '100dvh' : '100vh',
        margin: 0,
        padding: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      {children}
    </motion.div>
  )
}

export function FadeIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay, ease: [0.4, 0, 0.2, 1] }}
      style={{ willChange: "opacity" }}
    >
      {children}
    </motion.div>
  )
}

export function SlideUp({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay, ease: [0.4, 0, 0.2, 1] }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  )
}
