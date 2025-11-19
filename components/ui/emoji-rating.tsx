"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface EmojiRatingProps {
  label: string
  emojis: { emoji: string; value: number; label: string }[]
  selectedValue: number | null
  onSelect: (value: number) => void
}

export function EmojiRating({
  label,
  emojis,
  selectedValue,
  onSelect,
}: EmojiRatingProps) {
  return (
    <div className="mb-3">
      <p className="text-xs font-bold text-white/90 mb-2.5 text-center">
        {label}
      </p>
      <div className="flex justify-center gap-2">
        {emojis.map((item) => {
          const isSelected = selectedValue === item.value
          return (
            <motion.button
              key={item.value}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onSelect(item.value)
              }}
              type="button"
              className={cn(
                "relative p-2.5 rounded-[16px] transition-all duration-200",
                "flex flex-col items-center gap-1",
                isSelected
                  ? "bg-white text-black border-2 border-white"
                  : "bg-white/5 border-2 border-white/20 hover:bg-white/10 hover:border-white/30",
                "touch-manipulation cursor-pointer pointer-events-auto",
                "relative z-10"
              )}
            >
              <span className="text-2xl">{item.emoji}</span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

