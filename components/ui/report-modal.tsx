"use client"

import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { X, AlertTriangle } from "lucide-react"
import { useState } from "react"

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  profileName: string
}

const REPORT_REASONS = [
  "Inappropriate behavior",
  "Spam or fake profile",
  "Harassment",
  "Other",
]

export function ReportModal({
  isOpen,
  onClose,
  onConfirm,
  profileName,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("")
  const [customReason, setCustomReason] = useState("")

  const handleConfirm = () => {
    const reason = selectedReason === "Other" ? customReason : selectedReason
    if (reason.trim()) {
      onConfirm(reason)
      setSelectedReason("")
      setCustomReason("")
    }
  }

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
                "p-6 pointer-events-auto max-h-[80vh] overflow-y-auto scrollbar-hide"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-white/80" />
                  <h3 className="text-lg font-bold text-slate-100">
                    Report {profileName}?
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
              
              <p className="text-sm text-slate-300/80 mb-4">
                Why are you reporting this person?
              </p>

              <div className="space-y-2 mb-4">
                {REPORT_REASONS.map((reason) => (
                  <motion.button
                    key={reason}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedReason(reason)}
                    type="button"
                      className={cn(
                        "w-full px-4 py-2.5 rounded-xl text-left text-sm font-medium transition-all",
                        selectedReason === reason
                          ? "bg-white/10 border-2 border-white/35 text-white"
                          : "bg-slate-900/30 border border-white/10 text-slate-200 hover:bg-white/5"
                    )}
                  >
                    {reason}
                  </motion.button>
                ))}
              </div>

              {selectedReason === "Other" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mb-4"
                >
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Please describe the issue..."
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl",
                      "bg-slate-900/40 border border-white/10",
                      "text-slate-100 placeholder:text-slate-500",
                      "backdrop-blur-xl transition-all duration-200",
                      "focus:outline-none focus:border-white/40",
                      "focus:ring-2 focus:ring-white/15",
                      "text-sm resize-none"
                    )}
                    rows={3}
                  />
                </motion.div>
              )}
              
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onClose()
                    setSelectedReason("")
                    setCustomReason("")
                  }}
                  type="button"
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-2xl",
                    "border border-white/20 bg-transparent",
                    "text-white font-semibold text-sm",
                    "backdrop-blur-xl transition-all duration-200",
                    "hover:border-white/35 hover:bg-white/10",
                    "touch-manipulation cursor-pointer",
                    "relative z-10"
                  )}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleConfirm()
                  }}
                  type="button"
                  disabled={!selectedReason || (selectedReason === "Other" && !customReason.trim())}
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-2xl",
                    "bg-white text-slate-900 font-semibold text-sm",
                    "border border-white/80 backdrop-blur-xl",
                    "shadow-[0_12px_35px_rgba(0,0,0,0.45)]",
                    "transition-all duration-200",
                    "hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(0,0,0,0.55)]",
                    "touch-manipulation cursor-pointer",
                    "relative z-10",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  Report
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

