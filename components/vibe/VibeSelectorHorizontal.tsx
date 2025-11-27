"use client"

import { PillItem } from "./PillItem"

interface Vibe {
  id: string
  emoji: string
  label: string
}

interface VibeSelectorHorizontalProps {
  vibes: Array<{ id: string; emoji: string; label: string }>
  selectedId: string | null
  onSelect: (id: string) => void
}

export function VibeSelectorHorizontal({ vibes, selectedId, onSelect }: VibeSelectorHorizontalProps) {
  return (
    <div className="overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="flex gap-3" style={{ paddingBottom: '4px' }}>
        {vibes.map((vibe) => (
          <PillItem
            key={vibe.id}
            id={vibe.id}
            emoji={vibe.emoji}
            label={vibe.label}
            selected={selectedId === vibe.id}
            onSelect={() => onSelect(vibe.id)}
          />
        ))}
      </div>
    </div>
  )
}

