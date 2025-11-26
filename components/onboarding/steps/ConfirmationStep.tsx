"use client"

import { AnimatedButton } from "@/components/ui/animated-button"
import { tokens } from "@/lib/design-tokens"
import { VIBES } from "@/lib/constants"
import { NEWS_TOPICS, POP_CULTURE_TOPICS, GENERAL_TOPICS, SPORTS_TOPICS } from "@/lib/constants"
import { ChevronLeft, Check } from "lucide-react"

const ALL_TOPICS = [...NEWS_TOPICS, ...POP_CULTURE_TOPICS, ...GENERAL_TOPICS, ...SPORTS_TOPICS]

interface ConfirmationStepProps {
  name: string
  vibe: string | null
  topic: string | null
  timeframe: number | null
  onSubmit: () => Promise<void>
  loading: boolean
  error: string | null
  onBack?: () => void
}

export function ConfirmationStep({ name, vibe, topic, timeframe, onSubmit, loading, error, onBack }: ConfirmationStepProps) {
  const selectedVibe = VIBES.find(v => v.id === vibe)
  const selectedTopic = ALL_TOPICS.find(t => t.id === topic)

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
          You&apos;re all set!
        </h1>
        <p style={{
          ...tokens.typography.body,
          color: tokens.colors.textSecondary,
          margin: 0,
          textAlign: 'center',
        }}>
          Review your selections and start connecting
        </p>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacing[16],
        padding: tokens.spacing[20],
        borderRadius: '16px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[12] }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: '20px' }}>👤</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{
              ...tokens.typography.label,
              color: tokens.colors.textSecondary,
              margin: 0,
              marginBottom: '4px',
            }}>
              Name
            </p>
            <p style={{
              fontSize: '16px',
              fontWeight: 500,
              color: tokens.colors.textPrimaryOnDark,
              margin: 0,
            }}>
              {name}
            </p>
          </div>
        </div>

        {selectedVibe && (
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[12] }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '20px' }}>{selectedVibe.icon}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{
                ...tokens.typography.label,
                color: tokens.colors.textSecondary,
                margin: 0,
                marginBottom: '4px',
              }}>
                Vibe
              </p>
              <p style={{
                fontSize: '16px',
                fontWeight: 500,
                color: tokens.colors.textPrimaryOnDark,
                margin: 0,
              }}>
                {selectedVibe.label}
              </p>
            </div>
          </div>
        )}

        {selectedTopic && (
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[12] }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '20px' }}>{selectedTopic.icon || '💬'}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{
                ...tokens.typography.label,
                color: tokens.colors.textSecondary,
                margin: 0,
                marginBottom: '4px',
              }}>
                Topic
              </p>
              <p style={{
                fontSize: '16px',
                fontWeight: 500,
                color: tokens.colors.textPrimaryOnDark,
                margin: 0,
              }}>
                {selectedTopic.label}
              </p>
            </div>
          </div>
        )}

        {timeframe !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[12] }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '20px' }}>⏱️</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{
                ...tokens.typography.label,
                color: tokens.colors.textSecondary,
                margin: 0,
                marginBottom: '4px',
              }}>
                Timeframe
              </p>
              <p style={{
                fontSize: '16px',
                fontWeight: 500,
                color: tokens.colors.textPrimaryOnDark,
                margin: 0,
              }}>
                {timeframe} minutes
              </p>
            </div>
          </div>
        )}

        {timeframe === null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[12] }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '20px' }}>⏱️</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{
                ...tokens.typography.label,
                color: tokens.colors.textSecondary,
                margin: 0,
                marginBottom: '4px',
              }}>
                Timeframe
              </p>
              <p style={{
                fontSize: '16px',
                fontWeight: 500,
                color: tokens.colors.textPrimaryOnDark,
                margin: 0,
              }}>
                Flexible
              </p>
            </div>
          </div>
        )}
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
          onClick={onSubmit}
          disabled={loading}
          style={{ flex: 1 }}
        >
          {loading ? 'Completing...' : 'Start connecting'}
        </AnimatedButton>
      </div>
    </div>
  )
}

