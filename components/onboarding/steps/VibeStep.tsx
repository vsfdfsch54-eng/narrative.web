"use client"

import { useState, useEffect } from "react"
import { AnimatedButton } from "@/components/ui/animated-button"
import { tokens } from "@/lib/design-tokens"
import { VIBES } from "@/lib/constants"
import { Vibe } from "@/lib/types"
import { ChevronLeft } from "lucide-react"

interface VibeStepProps {
  selectedVibe: string | null
  onVibeChange: (vibe: string | null) => void
  onSubmit: (vibe: string) => Promise<void>
  loading: boolean
  error: string | null
  onBack?: () => void
}

export function VibeStep({ selectedVibe, onVibeChange, onSubmit, loading, error, onBack }: VibeStepProps) {
  const [localVibe, setLocalVibe] = useState<string | null>(selectedVibe)

  useEffect(() => {
    setLocalVibe(selectedVibe)
  }, [selectedVibe])

  const handleVibeSelect = (vibeId: string) => {
    const newVibe = localVibe === vibeId ? null : vibeId
    setLocalVibe(newVibe)
    onVibeChange(newVibe)
  }

  const handleSubmit = () => {
    if (!localVibe) return
    // Call onSubmit but don't await - navigation happens immediately
    onSubmit(localVibe).catch((error) => {
      console.error('[VibeStep] Submit error:', error)
    })
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
          Choose your vibe
        </h1>
        <p style={{
          ...tokens.typography.body,
          color: tokens.colors.textSecondary,
          margin: 0,
          textAlign: 'center',
        }}>
          Set the tone for your conversations
        </p>
      </div>

      <div style={{
        display: 'grid',
        gap: tokens.spacing[12],
        gridTemplateColumns: '1fr',
      }}>
        {VIBES.map((vibe: Vibe) => {
          const isSelected = localVibe === vibe.id
          return (
            <button
              key={vibe.id}
              type="button"
              onClick={() => handleVibeSelect(vibe.id)}
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
                display: 'flex',
                alignItems: 'center',
                gap: tokens.spacing[12],
                opacity: loading ? 0.5 : 1,
              }}
            >
              <span style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0,
              }}>
                {vibe.icon}
              </span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '16px', fontWeight: 500 }}>{vibe.label}</span>
              </div>
            </button>
          )
        })}
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
          disabled={!localVibe || loading}
          style={{ flex: 1 }}
        >
          {loading ? 'Saving...' : 'Continue'}
        </AnimatedButton>
      </div>
    </div>
  )
}

