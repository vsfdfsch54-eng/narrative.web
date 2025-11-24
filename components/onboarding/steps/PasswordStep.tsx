"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { AnimatedButton } from "@/components/ui/animated-button"
import { tokens } from "@/lib/design-tokens"
import { ChevronLeft } from "lucide-react"

interface PasswordStepProps {
  password: string
  onPasswordChange: (password: string) => void
  onSubmit: (password: string) => Promise<void>
  loading: boolean
  error: string | null
  onBack?: () => void
}

export function PasswordStep({ password, onPasswordChange, onSubmit, loading, error, onBack }: PasswordStepProps) {
  const [localPassword, setLocalPassword] = useState(password)
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const validatePassword = () => {
    if (!localPassword) {
      setPasswordError("")
      return true
    }
    if (localPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters")
      return false
    }
    if (confirmPassword && localPassword !== confirmPassword) {
      setPasswordError("Passwords do not match")
      return false
    }
    setPasswordError("")
    return true
  }

  const handleSubmit = async () => {
    if (!validatePassword()) return
    if (!localPassword.trim()) {
      // Skip password if empty (optional)
      await onSubmit("")
      return
    }
    onPasswordChange(localPassword)
    await onSubmit(localPassword)
  }

  const isValid = !localPassword || (localPassword.length >= 6 && (!confirmPassword || localPassword === confirmPassword))

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
          Create a password
        </h1>
        <p style={{
          ...tokens.typography.body,
          color: tokens.colors.textSecondary,
          margin: 0,
          textAlign: 'center',
        }}>
          Choose a secure password (optional)
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
            Password
          </label>
          <Input
            type="password"
            placeholder="••••••••"
            value={localPassword}
            onChange={(e) => {
              setLocalPassword(e.target.value)
              validatePassword()
            }}
            disabled={loading}
            autoFocus
          />
        </div>

        {localPassword && (
          <div>
            <label style={{
              ...tokens.typography.label,
              color: tokens.colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: tokens.spacing[8],
              display: 'block',
            }}>
              Confirm Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                validatePassword()
              }}
              disabled={loading}
            />
          </div>
        )}

        {(passwordError || error) && (
          <p style={{
            ...tokens.typography.label,
            color: '#EF4444',
            margin: 0,
            textAlign: 'center',
          }}>
            {passwordError || error}
          </p>
        )}
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
          disabled={loading}
          style={{ flex: 1 }}
        >
          {loading ? 'Saving...' : localPassword ? 'Continue' : 'Skip'}
        </AnimatedButton>
      </div>
    </div>
  )
}

