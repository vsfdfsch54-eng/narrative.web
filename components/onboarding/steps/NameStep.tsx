"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { AnimatedButton } from "@/components/ui/animated-button"
import { tokens } from "@/lib/design-tokens"
import { ChevronLeft } from "lucide-react"

interface NameStepProps {
  firstName: string
  lastName: string
  onFirstNameChange: (firstName: string) => void
  onLastNameChange: (lastName: string) => void
  onSubmit: (firstName: string, lastName: string) => Promise<void>
  loading: boolean
  error: string | null
  onBack?: () => void
}

export function NameStep({ firstName, lastName, onFirstNameChange, onLastNameChange, onSubmit, loading, error, onBack }: NameStepProps) {
  const [localFirstName, setLocalFirstName] = useState(firstName)
  const [localLastName, setLocalLastName] = useState(lastName)

  const handleSubmit = () => {
    if (!localFirstName.trim() || !localLastName.trim()) return
    onFirstNameChange(localFirstName)
    onLastNameChange(localLastName)
    // Call onSubmit but don't await - navigation happens immediately
    onSubmit(localFirstName, localLastName).catch((error) => {
      console.error('[NameStep] Submit error:', error)
    })
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: tokens.spacing[20],
    }}>
      <div>
        <h1 style={{
          ...tokens.typography.title,
          color: tokens.colors.textPrimaryOnDark,
          margin: 0,
          marginBottom: tokens.spacing[8],
          textAlign: 'center',
        }}>
          What&apos;s your name?
        </h1>
        <p style={{
          ...tokens.typography.body,
          color: tokens.colors.textSecondary,
          margin: 0,
          textAlign: 'center',
        }}>
          This is how others will see you
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[16] }}>
        <div>
          <label style={{
            ...tokens.typography.label,
            color: tokens.colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: tokens.spacing[8],
            display: 'block',
          }}>
            First Name
          </label>
          <Input
            type="text"
            placeholder="First name"
            value={localFirstName}
            onChange={(e) => {
              setLocalFirstName(e.target.value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && localFirstName.trim() && localLastName.trim() && !loading) {
                handleSubmit()
              }
            }}
            disabled={loading}
            autoFocus
          />
        </div>
        <div>
          <label style={{
            ...tokens.typography.label,
            color: tokens.colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: tokens.spacing[8],
            display: 'block',
          }}>
            Last Name
          </label>
          <Input
            type="text"
            placeholder="Last name"
            value={localLastName}
            onChange={(e) => {
              setLocalLastName(e.target.value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && localFirstName.trim() && localLastName.trim() && !loading) {
                handleSubmit()
              }
            }}
            disabled={loading}
          />
        </div>
      </div>

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
          disabled={!localFirstName.trim() || !localLastName.trim() || loading}
          style={{ flex: 1 }}
        >
          {loading ? 'Saving...' : 'Continue'}
        </AnimatedButton>
      </div>
    </div>
  )
}

