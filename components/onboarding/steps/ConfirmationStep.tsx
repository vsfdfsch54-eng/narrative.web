"use client"

import { AnimatedButton } from "@/components/ui/animated-button"
import { tokens } from "@/lib/design-tokens"
import { INTERESTS, getInterestById } from "@/lib/interests"
import { ChevronLeft } from "lucide-react"

interface ConfirmationStepProps {
  firstName: string
  lastName: string
  interests: string[]
  onSubmit: () => Promise<void>
  loading: boolean
  error: string | null
  onBack?: () => void
}

export function ConfirmationStep({ firstName, lastName, interests, onSubmit, loading, error, onBack }: ConfirmationStepProps) {
  const fullName = `${firstName} ${lastName}`.trim()
  const selectedInterests = interests.map(id => getInterestById(id)).filter((interest): interest is NonNullable<typeof interest> => interest !== undefined)

  const handleSubmit = () => {
    // Call onSubmit but don't await - navigation happens immediately
    onSubmit().catch((error) => {
      console.error('[ConfirmationStep] Submit error:', error)
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
              {fullName || 'Not set'}
            </p>
          </div>
        </div>

        {selectedInterests.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[8] }}>
            <p style={{
              ...tokens.typography.label,
              color: tokens.colors.textSecondary,
              margin: 0,
              marginBottom: '4px',
            }}>
              Interests
            </p>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: tokens.spacing[8],
            }}>
              {selectedInterests.map(interest => (
                <span
                  key={interest.id}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '14px',
                    color: tokens.colors.textPrimaryOnDark,
                  }}
                >
                  {interest.emoji} {interest.label}
                </span>
              ))}
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
          onClick={handleSubmit}
          disabled={loading}
          style={{ flex: 1 }}
        >
          {loading ? 'Completing...' : 'Start connecting'}
        </AnimatedButton>
      </div>
    </div>
  )
}

