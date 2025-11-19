"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { SlideUp } from "@/components/ui/transitions"

interface SectionHeaderProps {
  title: string
  description?: string
  className?: string
  animate?: boolean
}

export function SectionHeader({
  title,
  description,
  className,
  animate = true,
}: SectionHeaderProps) {
  const content = (
    <div className={cn("space-y-2", className)}>
      <h1 className="text-4xl font-light tracking-tight gradient-text">
        {title}
      </h1>
      {description && (
        <p className="text-muted-foreground font-light">{description}</p>
      )}
    </div>
  )

  if (animate) {
    return <SlideUp>{content}</SlideUp>
  }

  return content
}

