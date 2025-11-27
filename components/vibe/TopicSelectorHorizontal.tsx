"use client"

import { PillItem } from "./PillItem"

interface Topic {
  id: string
  emoji: string
  label: string
}

interface TopicSelectorHorizontalProps {
  topics: Array<{ id: string; emoji: string; label: string }>
  selectedId: string | null
  onSelect: (id: string) => void
}

export function TopicSelectorHorizontal({ topics, selectedId, onSelect }: TopicSelectorHorizontalProps) {
  return (
    <div className="overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="flex gap-3" style={{ paddingBottom: '4px' }}>
        {topics.map((topic) => (
          <PillItem
            key={topic.id}
            id={topic.id}
            emoji={topic.emoji}
            label={topic.label}
            selected={selectedId === topic.id}
            onSelect={() => onSelect(topic.id)}
          />
        ))}
      </div>
    </div>
  )
}

