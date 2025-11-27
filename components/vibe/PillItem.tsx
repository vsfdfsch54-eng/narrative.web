"use client"

interface PillItemProps {
  id: string
  emoji: string
  label: string
  selected: boolean
  onSelect: () => void
}

export function PillItem({ id, emoji, label, selected, onSelect }: PillItemProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all whitespace-nowrap flex-shrink-0"
      style={{
        height: '48px',
        borderRadius: '9999px',
        paddingLeft: '15px',
        paddingRight: '15px',
        border: '1px solid rgba(255,255,255,0.10)',
        background: selected ? 'rgba(255,255,255,0.10)' : 'transparent',
        color: 'inherit',
      }}
    >
      <span className="text-xl">{emoji}</span>
      <span className="text-sm">{label}</span>
    </button>
  )
}

