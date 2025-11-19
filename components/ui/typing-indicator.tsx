"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface TypingIndicatorProps {
  className?: string
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={cn(
        "flex items-center gap-1.5 px-4 py-2.5 rounded-2xl",
        "bg-slate-800/40 border border-slate-700/30 backdrop-blur-xl",
        "max-w-[75px] mb-3",
        className
      )}
    >
      <motion.div
        className="h-2 w-2 rounded-full bg-slate-400"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.4,
          repeat: Infinity,
          delay: 0,
        }}
      />
      <motion.div
        className="h-2 w-2 rounded-full bg-slate-400"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.4,
          repeat: Infinity,
          delay: 0.2,
        }}
      />
      <motion.div
        className="h-2 w-2 rounded-full bg-slate-400"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.4,
          repeat: Infinity,
          delay: 0.4,
        }}
      />
    </motion.div>
  )
}

