"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { tokens } from "@/lib/design-tokens"
import { useEffect } from "react"

interface ToastProps {
  message: string
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export function Toast({ message, isVisible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            pointerEvents: 'none',
          }}
        >
          <div style={{
            padding: `${tokens.spacing[12]} ${tokens.spacing[18]}`,
            borderRadius: tokens.radii.button,
            background: 'rgba(15, 15, 17, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: tokens.spacing[12],
            minWidth: '280px',
            maxWidth: '90vw',
            pointerEvents: 'auto',
          }}>
            <p style={{
              ...tokens.typography.body,
              color: tokens.colors.textPrimaryOnDark,
              margin: 0,
              flex: 1,
            }}>
              {message}
            </p>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              style={{
                padding: tokens.spacing[4],
                background: 'transparent',
                border: 'none',
                color: tokens.colors.textSecondary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X style={{ width: '16px', height: '16px' }} />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

