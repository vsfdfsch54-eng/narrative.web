"use client"

import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { X, UserPlus, XCircle } from "lucide-react"

interface CommunityRequestModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept: () => void
  onDecline: () => void
  senderName: string
  senderId: string
}

export function CommunityRequestModal({
  isOpen,
  onClose,
  onAccept,
  onDecline,
  senderName,
  senderId,
}: CommunityRequestModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              className={cn(
                "w-full max-w-[320px] rounded-3xl",
                "glass-effect backdrop-blur-2xl",
                "border border-slate-700/30 bg-slate-800/40",
                "shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
                "p-6 pointer-events-auto"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">
                    Community Request
                  </h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onClose()
                  }}
                  type="button"
                  className="p-1 rounded-lg hover:bg-slate-700/30 transition-colors cursor-pointer touch-manipulation"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </motion.button>
              </div>
              
              <p className="text-sm text-slate-300/80 mb-6">
                <span className="font-semibold text-slate-100">{senderName}</span> wants to add you to their community. Would you like to add them back?
              </p>
              
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onDecline()
                  }}
                  type="button"
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-2xl",
                    "border border-white/15 bg-transparent",
                    "text-white font-semibold text-sm",
                    "backdrop-blur-xl transition-all duration-200",
                    "hover:border-white/35 hover:bg-white/5",
                    "touch-manipulation cursor-pointer",
                    "relative z-10 flex items-center justify-center gap-2"
                  )}
                >
                  <XCircle className="h-4 w-4" />
                  Decline
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onAccept()
                  }}
                  type="button"
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-2xl",
                    "bg-white text-slate-900 font-semibold text-sm",
                    "border border-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.45)]",
                    "transition-all duration-200",
                    "hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.55)]",
                    "touch-manipulation cursor-pointer",
                    "relative z-10 flex items-center justify-center gap-2"
                  )}
                >
                  <UserPlus className="h-4 w-4" />
                  Accept
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

