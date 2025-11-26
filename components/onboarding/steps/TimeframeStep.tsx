"use client"

import { useState, useEffect } from "react"
import { AnimatedButton } from "@/components/ui/animated-button"
import { tokens } from "@/lib/design-tokens"
import { ChevronLeft } from "lucide-react"

const TIME_LIMITS = [5, 15, 30]

interface TimeframeStepProps {
  selectedTimeframe: number | null
  onTimeframeChange: (timeframe: number | null) => void
  onSubmit: (timeframe: number | null) => Promise<void>
  loading: boolean
  error: string | null
  onBack?: () => void
}

export function TimeframeStep({ selectedTimeframe, onTimeframeChange, onSubmit, loading, error, onBack }: TimeframeStepProps) {
  const [localTimeframe, setLocalTimeframe] = useState<number | null>(selectedTimeframe)

  useEffect(() => {
    setLocalTimeframe(selectedTimeframe)
  }, [selectedTimeframe])

  const handleTimeframeSelect = (timeframe: number | null) => {
    const newTimeframe = localTimeframe === timeframe ? null : timeframe
    setLocalTimeframe(newTimeframe)
    onTimeframeChange(newTimeframe)
  }

  const handleSubmit = async () => {
    await onSubmit(localTimeframe)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: tokens.spacing[20],
      width: '100%',
      maxWidth: '600px',
      margin: '0 auto',
    }}>
      <div>
        <h1 style={{
          ...tokens.typography.title,
          color: tokens.colors.textPrimaryOnDark,
          margin: 0,
          marginBottom: tokens.spacing[8],
          textAlign: 'center',
        }}>
          Set a timer
        </h1>
        <p style={{
          ...tokens.typography.body,
          color: tokens.colors.textSecondary,
          margin: 0,
          textAlign: 'center',
        }}>
          How long do you want to chat? You can always extend later.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gap: tokens.spacing[12],
        gridTemplateColumns: '1fr',
      }}>
        {TIME_LIMITS.map((limit) => {
          const isSelected = localTimeframe === limit
          return (
            <button
              key={limit}
              type="button"
              onClick={() => handleTimeframeSelect(limit)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px 20px',
                borderRadius: '16px',
                border: isSelected ? '2px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
                background: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                color: tokens.colors.textPrimaryOnDark,
                textAlign: 'left',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                opacity: loading ? 0.5 : 1,
              }}
            >
              <span style={{ fontSize: '16px', fontWeight: 500 }}>{limit} minutes</span>
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => handleTimeframeSelect(null)}
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px 20px',
            borderRadius: '16px',
            border: localTimeframe === null ? '2px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
            background: localTimeframe === null ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
            color: tokens.colors.textPrimaryOnDark,
            textAlign: 'left',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            opacity: loading ? 0.5 : 1,
          }}
        >
          <span style={{ fontSize: '16px', fontWeight: 500 }}>I&apos;m flexible</span>
        </button>
      </div>

      {error && (
        <p style={{
          ...tokens.typography.label,
          color: '#EF4444',
          margin: 0,
          textAlign: 'center',
        }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: tokens.spacing[16] }}>
        {onBack && (
          <AnimatedButton
            variant="ghost"
            onClick={onBack}
            disabled={loading}
            style={{ flex: 1 }}
          >
            <ChevronLeft style={{ width: '16px', height: '16px' }} />
          </AnimatedButton>
        )}
        <AnimatedButton
          onClick={handleSubmit}
          disabled={loading}
          style={{ flex: 1 }}
        >
          {loading ? 'Saving...' : 'Continue'}
        </AnimatedButton>
      </div>
    </div>
  )
}

