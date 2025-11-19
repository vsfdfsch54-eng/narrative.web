"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Topic } from "@/lib/types"

interface TopicCardProps {
  topic: Topic
  selected?: boolean
  onClick?: () => void
  delay?: number
}

export function TopicCard({
  topic,
  selected = false,
  onClick,
  delay = 0,
}: TopicCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay }}
      onClick={onClick}
      className={cn(
        "aspect-square rounded-xl border-2 transition-all duration-200",
        "bg-card/50 backdrop-blur-sm",
        "hover:scale-105 hover:border-primary/50",
        selected
          ? "border-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
          : "border-border/50"
      )}
    >
      <div className="flex flex-col items-center justify-center h-full space-y-3 p-4">
        <span className="text-4xl">{topic.icon}</span>
        <span className="text-sm font-medium text-foreground text-center">
          {topic.label}
        </span>
      </div>
    </motion.button>
  )
}
