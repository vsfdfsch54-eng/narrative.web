"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { IntimacyTier } from "@/lib/types"
import { INTIMACY_TIERS } from "@/lib/constants"

interface IntimacySelectorProps {
  selected: IntimacyTier
  onSelect: (tier: IntimacyTier) => void
  className?: string
}

export function IntimacySelector({
  selected,
  onSelect,
  className,
}: IntimacySelectorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {INTIMACY_TIERS.map((tier) => (
        <Button
          key={tier.id}
          variant={selected === tier.id ? "primary" : "outline"}
          size="sm"
          onClick={() => onSelect(tier.id)}
          className={cn(
            "transition-all duration-200",
            selected === tier.id && "ring-2 ring-offset-2 ring-offset-background"
          )}
        >
          {tier.label}
        </Button>
      ))}
    </div>
  )
}

