"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { AnimatedButton } from "@/components/ui/animated-button"
import { tokens } from "@/lib/design-tokens"
import { ChevronLeft } from "lucide-react"

interface NameStepProps {
  name: string
  onNameChange: (name: string) => void
  onSubmit: (name: string) => Promise<void>
  loading: boolean
  error: string | null
  onBack?: () => void
}

export function NameStep({ name, onNameChange, onSubmit, loading, error, onBack }: NameStepProps) {
  const [localName, setLocalName] = useState(name)

  const handleSubmit = async () => {
    if (!localName.trim()) return
    onNameChange(localName)
    await onSubmit(localName)
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
            Name
          </label>
          <Input
            type="text"
            placeholder="Your name"
            value={localName}
            onChange={(e) => {
              const newName = e.target.value
              setLocalName(newName)
              if (typeof window !== 'undefined') {
                localStorage.setItem('onboarding_name', newName)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && localName.trim() && !loading) {
                handleSubmit()
              }
            }}
            disabled={loading}
            autoFocus
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
          disabled={!localName.trim() || loading}
          style={{ flex: 1 }}
        >
          {loading ? 'Saving...' : 'Continue'}
        </AnimatedButton>
      </div>
    </div>
  )
}

